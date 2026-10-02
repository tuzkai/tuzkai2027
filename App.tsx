import { useEffect, useRef } from 'react';
import { ClerkProvider, Show, SignIn, SignUp, useClerk, useUser } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { getListAdminStoreProductsQueryKey, useListAdminStoreProducts } from '@workspace/api-client-react';
import { Redirect, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { SiteLayout, SiteLink as Link, toolLinks } from './components/site';
import { StudioDashboard, IdeasPage, DesignPage, PricingPage, BusinessPage, EtsyPage } from './pages/tools';
import { CustomPage, AboutPage, ContactPage, FAQPage, NotFoundPage } from './pages/public';
import { HomePage, ShopPage, DigitalPage, AIToolsPage, CategoriesPage, SearchPage, CartPage, ProductPage } from './pages/store';
import { PrivacyPage, TermsPage, DisclaimerPage, RefundPolicyPage, LicenseTermsPage } from './pages/legal';
import { HelpCenterPage } from './pages/help';
import SettingsPage from './pages/settings';
import StoreAdminPage from './pages/store-admin';

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const queryClient = new QueryClient();

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY in .env file');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#342B25',
    colorForeground: '#342B25',
    colorMutedForeground: '#796E63',
    colorDanger: '#9D3D37',
    colorBackground: '#F7F4EE',
    colorInput: '#FFFEFA',
    colorInputForeground: '#342B25',
    colorNeutral: '#DED3C3',
    fontFamily: "'DM Sans', sans-serif",
    borderRadius: '8px',
  },
  elements: {
    rootBox: { width: '100%', display: 'flex', justifyContent: 'center' },
    cardBox: {
      width: '440px',
      maxWidth: '100%',
      overflow: 'hidden',
      borderRadius: '16px',
      backgroundColor: '#F7F4EE',
      boxShadow: '0 16px 48px rgba(52, 43, 37, 0.12)',
      border: '1px solid #E7DFD2',
    },
    card: { backgroundColor: 'transparent', boxShadow: 'none', border: 'none' },
    footer: { backgroundColor: 'transparent', boxShadow: 'none', border: 'none' },
    headerTitle: { color: '#342B25', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 },
    headerSubtitle: { color: '#796E63', fontFamily: "'DM Sans', sans-serif" },
    socialButtonsBlockButtonText: { color: '#342B25', fontFamily: "'DM Sans', sans-serif" },
    formFieldLabel: { color: '#342B25', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 },
    footerActionLink: { color: '#765B39', fontWeight: 600 },
    footerActionText: { color: '#796E63' },
    dividerText: { color: '#796E63' },
    identityPreviewEditButton: { color: '#765B39' },
    formFieldSuccessText: { color: '#496447' },
    alertText: { color: '#7F302B' },
    logoBox: { marginBottom: '12px' },
    logoImage: { maxHeight: '56px', width: 'auto' },
    socialButtonsBlockButton: {
      backgroundColor: '#FFFEFA',
      border: '1px solid #DED3C3',
      borderRadius: '6px',
    },
    formButtonPrimary: {
      backgroundColor: '#342B25',
      color: '#F7F4EE',
      borderRadius: '6px',
      fontFamily: "'DM Sans', sans-serif",
      fontWeight: 600,
    },
    formFieldInput: {
      color: '#342B25',
      backgroundColor: '#FFFEFA',
      border: '1px solid #DED3C3',
      borderRadius: '6px',
      fontFamily: "'DM Sans', sans-serif",
    },
    footerAction: { backgroundColor: 'transparent' },
    dividerLine: { backgroundColor: '#DED3C3' },
    alert: { backgroundColor: '#F8E9E6', borderRadius: '6px' },
    otpCodeFieldInput: {
      color: '#342B25',
      backgroundColor: '#FFFEFA',
      borderColor: '#DED3C3',
      borderRadius: '6px',
    },
    formFieldRow: { color: '#342B25' },
    main: { backgroundColor: 'transparent' },
  },
};

const pageMetadata: Record<string, [string, string]> = {
  '/': [
    'TuzakAI — AI Tools & Digital Products',
    'TuzakAI by Sztuzk provides practical AI tools and digital products for creative entrepreneurs.',
  ],
  '/shop': ['Explore TuzakAI | AI Tools & Digital Products', 'Explore creative tools and digital resources from TuzakAI by Sztuzk.'],
  '/custom-jewelry': ['Custom Jewelry Brief | TuzakAI', 'Prepare a personal jewelry idea brief in your browser with TuzakAI by Sztuzk.'],
  '/jewelry-studio': ['Jewelry Studio Tools | TuzakAI by Sztuzk', 'Explore jewelry design, pricing, business planning, ideas, and listing tools.'],
  '/jewelry-studio/design-generator': ['Jewelry Design Generator | TuzakAI', 'Turn a jewelry idea into an illustrative design concept with the TuzakAI Jewelry Studio.'],
  '/jewelry-studio/pricing-calculator': ['Jewelry Pricing Calculator | TuzakAI', 'Estimate jewelry production costs, selling price, fees, and profit using your own costs.'],
  '/jewelry-studio/start-business': ['Start a Jewelry Business | TuzakAI', 'Build a practical, beginner-friendly jewelry business roadmap.'],
  '/jewelry-studio/etsy-listing': ['Etsy Listing Draft Tool | TuzakAI', 'Create an editable Etsy listing draft with a description, photo checklist, and suggested tags.'],
  '/jewelry-studio/jewelry-ideas': ['Jewelry Ideas Generator | TuzakAI', 'Explore jewelry ideas based on style, materials, color, and skill.'],
  '/digital-products': ['Digital Products | TuzakAI', 'Explore practical resources for creative entrepreneurs from TuzakAI by Sztuzk.'],
  '/about': ['About TuzakAI by Sztuzk', 'Learn about TuzakAI, practical tools, and digital products for creative entrepreneurs.'],
  '/contact': ['Contact & Support | TuzakAI', 'Find current support information and ways to get help with TuzakAI.'],
  '/faq': ['Frequently Asked Questions | TuzakAI', 'Answers about TuzakAI tools, account access, saved work, estimates, and resources.'],
  '/privacy': ['Privacy Policy | TuzakAI', 'Learn how TuzakAI handles account information, browser drafts, and site data.'],
  '/terms': ['Terms of Use | TuzakAI', 'Read the terms for using TuzakAI tools and digital resources.'],
  '/disclaimer': ['Disclaimer | TuzakAI', 'Understand the limits of generated ideas, estimates, and planning drafts.'],
  '/help-center': ['Help Center | TuzakAI', 'Find answers, contact support, and get help with TuzakAI tools and your account.'],
  '/refund-policy': ['Refund Policy | TuzakAI', 'Information about refunds while paid checkout is not active on TuzakAI.'],
  '/license-terms': ['License Terms | TuzakAI', 'Information about digital product licenses while paid checkout is not active.'],
  '/ai-tools': ['AI Tools | TuzakAI by Sztuzk', 'Explore creative AI tools and focused business-planning utilities from TuzakAI.'],
  '/categories': ['Explore Categories | TuzakAI', 'Find a useful place to begin, from a first design to business decisions.'],
  '/search': ['Search | TuzakAI', 'Search the TuzakAI tools, categories, and upcoming resources.'],
  '/cart': ['Cart | TuzakAI', 'Review your cart and explore the TuzakAI digital resource library.'],
  '/account': ['Your Account | TuzakAI', 'View your TuzakAI account details and manage your signed-in session.'],
  '/account/purchases': ['Your Purchases | TuzakAI', 'View information about purchase history availability in your TuzakAI account.'],
  '/account/tools': ['Your Tools | TuzakAI', 'Open the currently accessible tools from your TuzakAI account.'],
  '/account/licenses': ['Your Licenses | TuzakAI', 'View information about license records in your TuzakAI account.'],
  '/admin/settings': ['Admin Settings | TuzakAI', 'Manage the public website and social contact settings for TuzakAI.'],
  '/admin/store': ['Store Catalog | TuzakAI', 'Manage TuzakAI products and categories.'],
  '/sign-in': ['Sign In | TuzakAI', 'Sign in to your TuzakAI account.'],
  '/sign-up': ['Create an Account | TuzakAI', 'Create your TuzakAI account.'],
};

function Metadata() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.split(/[?#]/, 1)[0] || '/';
    const [title, description] = pageMetadata[path] ?? [
      'TuzakAI — AI Tools & Digital Products',
      'TuzakAI by Sztuzk provides practical AI tools and digital products for creative entrepreneurs.',
    ];
    const canonicalUrl = `https://tuzkai.com${path === '/' ? '/' : path}`;
    document.title = title;
    const setMeta = (attribute: 'name' | 'property', key: string, content: string) => {
      let meta = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, key);
        document.head.appendChild(meta);
      }
      meta.content = content;
    };
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
  }, [location]);
  return null;
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const queryCache = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        queryCache.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryCache]);

  return null;
}

function AccountPage() {
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const adminCheck = useListAdminStoreProducts({
    query: { queryKey: getListAdminStoreProductsQueryKey(), retry: false },
  });
  if (!isLoaded) return <div className="container" style={{ padding: '80px 0' }} role="status">Loading your account…</div>;
  if (!user) return <Redirect to="/" />;

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  const primaryEmail = user.primaryEmailAddress?.emailAddress;
  return <div className="storefront account-page"><div className="store-page-intro"><div className="store-container"><div className="store-overline"><span>07 / YOUR ACCOUNT</span><span>TUZAKAI BY SZTUZK</span></div><div className="store-intro-row"><div><h1>Good to see you{user.firstName ? `, ${user.firstName}` : ''}.</h1><p>Your account, your details, and a place to return to the work.</p></div></div></div></div><div className="store-container account-grid"><section className="account-panel"><span className="store-kicker">PROFILE / 01</span><h2>Account details</h2><dl><div><dt>Name</dt><dd data-testid="text-account-name">{fullName || 'Not provided'}</dd></div><div><dt>Email</dt><dd data-testid="text-account-email">{primaryEmail || 'Not provided'}</dd></div></dl><button type="button" className="store-button store-button-dark" onClick={() => openUserProfile()} data-testid="button-manage-profile">Manage profile</button></section><section className="account-panel account-panel-tint"><span className="store-kicker">YOUR WORK / 02</span><h2>Keep creating.</h2><p>Purchases and downloads will appear here when the store is ready. For now, explore the tools and browse the growing collection.</p><a href={`${basePath}/tuzakai/`} className="store-text-link">Open Jewelry Designer →</a><a href={`${basePath}/shop`} className="store-text-link">Browse the shop →</a></section><div className="account-bottom">{adminCheck.isSuccess && <div className="account-admin-links"><a href={`${basePath}/admin/store`} className="store-text-link" data-testid="link-admin-store">Manage store catalog</a><a href={`${basePath}/admin/settings`} className="store-text-link">Site settings</a></div>}<button type="button" className="store-text-link account-signout" onClick={() => signOut({ redirectUrl: basePath || '/' })} data-testid="button-sign-out">Sign out →</button></div></div></div>;
}

function ProtectedAccount() {
  return (
    <>
      <Show when="signed-in"><AccountPage /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function AccountPurchasesPage() {
  return <AccountSectionPage title="Purchases" kicker="YOUR ACCOUNT / PURCHASES" description="A place for purchase history when verified purchase records are available.">
    <section className="account-panel account-panel-tint">
      <span className="store-kicker">PURCHASE HISTORY</span>
      <h2>Checkout is not active</h2>
      <p>Paid checkout is not currently available on TuzakAI. Purchase records have not been provided to this account view, so there is no verified history to display here.</p>
      <p>This does not determine whether you have a purchase elsewhere. For help with a specific matter, contact support.</p>
      <Link href="/contact" className="store-text-link">Contact / Support →</Link>
    </section>
  </AccountSectionPage>;
}

function AccountToolsPage() {
  return <AccountSectionPage title="My AI Tools" kicker="YOUR ACCOUNT / TOOLS" description="Tools currently accessible on TuzakAI, with no paid unlock implied.">
    <section className="account-panel account-panel-tint">
      <span className="store-kicker">AVAILABLE TOOLS</span>
      <h2>Explore the Studio</h2>
      <p>The original Studio tools are currently accessible without sign-in and save their drafts in this browser. Signing in does not sync that work or unlock paid access.</p>
      <Link href="/jewelry-studio" className="store-text-link">Open the original Studio →</Link>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {toolLinks.map((tool) => <Link key={tool.path} href={tool.path} className="store-text-link">{tool.title} →</Link>)}
      </div>
      <Link href="/tuzakai/" className="store-text-link">Open TuzakAI Jewelry Designer →</Link>
      <p className="fine">Designer saved work uses its separate browser workspace; it is not connected to this Clerk account.</p>
    </section>
  </AccountSectionPage>;
}

function AccountLicensesPage() {
  return <AccountSectionPage title="Licenses" kicker="YOUR ACCOUNT / LICENSES" description="Information about license records associated with this account.">
    <section className="account-panel account-panel-tint">
      <span className="store-kicker">LICENSE RECORDS</span>
      <h2>Records are not available here</h2>
      <p>Paid checkout is not currently available, and license records have not been provided to this account view. This page cannot verify or display a license.</p>
      <p>This is not a statement that you do or do not hold rights through another source. Check the terms supplied with any item obtained elsewhere, or contact support for help.</p>
      <Link href="/contact" className="store-text-link">Contact / Support →</Link>
    </section>
  </AccountSectionPage>;
}

function AccountSectionPage({ title, kicker, description, children }: {
  title: string;
  kicker: string;
  description: string;
  children: React.ReactNode;
}) {
  return <div className="storefront account-page">
    <div className="store-page-intro"><div className="store-container">
      <div className="store-overline"><span>{kicker}</span><span>TUZAKAI BY SZTUZK</span></div>
      <div className="store-intro-row"><div><h1>{title}</h1><p>{description}</p></div></div>
    </div></div>
    <div className="store-container account-grid">
      {children}
      <div className="account-bottom"><Link href="/account" className="store-text-link">← Back to your account</Link></div>
    </div>
  </div>;
}

function ProtectedAccountSection({ children }: { children: React.ReactNode }) {
  return <><Show when="signed-in">{children}</Show><Show when="signed-out"><Redirect to="/sign-in" /></Show></>;
}

function ProtectedSettings() {
  return (
    <>
      <Show when="signed-in"><SettingsPage /></Show>
      <Show when="signed-out"><Redirect to="/sign-in" /></Show>
    </>
  );
}

function ProtectedStoreAdmin() {
  return <><Show when="signed-in"><StoreAdminPage /></Show><Show when="signed-out"><Redirect to="/sign-in" /></Show></>;
}

function SignInPage() {
  return (
    <div style={{ minHeight: '70dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div style={{ minHeight: '70dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 20px' }}>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function SiteRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: { start: { title: 'Welcome back', subtitle: 'Sign in to your TuzakAI account' } },
        signUp: { start: { title: 'Create your account', subtitle: 'Get started with TuzakAI' } },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Metadata />
        <SiteLayout>
          <Switch>
             <Route path="/" component={HomePage} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/account" component={ProtectedAccount} />
            <Route path="/account/purchases"><ProtectedAccountSection><AccountPurchasesPage /></ProtectedAccountSection></Route>
            <Route path="/account/tools"><ProtectedAccountSection><AccountToolsPage /></ProtectedAccountSection></Route>
            <Route path="/account/licenses"><ProtectedAccountSection><AccountLicensesPage /></ProtectedAccountSection></Route>
            <Route path="/admin/settings" component={ProtectedSettings} />
             <Route path="/admin/store" component={ProtectedStoreAdmin} />
            <Route path="/shop" component={ShopPage} />
             <Route path="/products/:slug" component={ProductPage} />
            <Route path="/custom-jewelry" component={CustomPage} />
            <Route path="/jewelry-studio" component={StudioDashboard} />
            <Route path="/jewelry-studio/design-generator" component={DesignPage} />
            <Route path="/jewelry-studio/pricing-calculator" component={PricingPage} />
            <Route path="/jewelry-studio/start-business" component={BusinessPage} />
            <Route path="/jewelry-studio/etsy-listing" component={EtsyPage} />
            <Route path="/jewelry-studio/jewelry-ideas" component={IdeasPage} />
            <Route path="/digital-products" component={DigitalPage} />
            <Route path="/ai-tools" component={AIToolsPage} />
            <Route path="/categories" component={CategoriesPage} />
            <Route path="/search" component={SearchPage} />
            <Route path="/cart" component={CartPage} />
            <Route path="/about" component={AboutPage} />
            <Route path="/contact" component={ContactPage} />
            <Route path="/faq" component={FAQPage} />
            <Route path="/help-center" component={HelpCenterPage} />
            <Route path="/privacy" component={PrivacyPage} />
            <Route path="/terms" component={TermsPage} />
            <Route path="/disclaimer" component={DisclaimerPage} />
            <Route path="/refund-policy" component={RefundPolicyPage} />
            <Route path="/license-terms" component={LicenseTermsPage} />
            <Route component={NotFoundPage} />
          </Switch>
        </SiteLayout>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <SiteRoutes />
    </WouterRouter>
  );
}

export default App;