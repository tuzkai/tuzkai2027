import { Link } from 'wouter';
import { PageHeading } from '../components/site';

function InformationPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <PageHeading kicker="STUDIO INFORMATION" title={title} description={description} />
      <div className="card tool-panel" style={{ maxWidth: 850, lineHeight: 1.8 }}>
        {children}
        <p className="fine" style={{ marginTop: 36 }}>Last updated: 28 September 2026</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 className="serif" style={{ fontSize: 27, margin: '0 0 10px' }}>{title}</h2>
      <div className="muted">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <InformationPage title="Privacy Policy" description="How TuzakAI by Sztuzk handles information across its tools.">
      <Section title="About this page">
        <p>TuzakAI by Sztuzk includes a public catalog of digital products and AI tools, five legacy planning tools on this site, and a separate jewelry designer at <code>/tuzakai/</code>. Paid checkout is not currently available.</p>
      </Section>
      <Section title="Legacy tools and browser storage">
        <p>The five legacy tools store selections, generated drafts, pricing inputs, handoff details and saved projects in local storage in your browser. This work is not uploaded to or synced with a TuzakAI account, even if you sign in to the root site. Root-site sign-in is provided through Clerk, but the legacy tools do not connect their saved work to that account. Clearing this site’s browser data may remove the work; export anything you need to keep.</p>
        <p>The legacy tools can be used without signing in. Do not put passwords, payment details or other sensitive information in a draft. A draft saved in an older version may still contain details entered then; clear this site’s browser data if you no longer want to keep it.</p>
      </Section>
      <Section title="Designer saves and accounts">
        <p>The separate jewelry designer sends saved designs to its API. A signed browser cookie identifies the private designer workspace used to retrieve those saved designs. This is separate from Clerk sign-in: designer saves are not linked to a root-site account and do not provide account-based or cross-device syncing. If you clear or lose the cookie, saved designs may no longer be accessible through that browser.</p>
        <p>Clerk provides root-site account sign-in. The legacy tools remain browser-local regardless of sign-in. The custom jewelry brief is a browser-local draft and is not sent. The Contact / Support form is different: when you submit it, your name, email, subject and message are sent to the site API and stored as a support ticket for administrator review. An internal reply saved by an administrator is not automatically emailed to you. Paid checkout is not currently available.</p>
      </Section>
      <Section title="Other services used to display the site">
        <p>Loading this site involves technical requests to its hosting provider; root-site account sign-in is provided by Clerk, support requests are stored through the site API, and saved designer work uses the designer API. Fonts may load from Google Fonts, so your browser may also connect to Google to display them. These services may receive technical information such as your IP address and browser information when your browser connects. Their own handling of that information is governed by their practices.</p>
      </Section>
      <Section title="Your choices and updates">
        <p>Use Saved Projects in the legacy tools to export or delete a local project. Remove other local drafts and settings through your browser’s site-data controls; clearing them may permanently remove work you have not exported. Designer saved designs use the designer workspace identified by its browser cookie. You can sign out of a root-site account through the account controls.</p>
        <p>For questions about TuzakAI, this privacy information, or a submitted support request, use <Link href="/contact">Contact / Support</Link>. A direct support email is displayed there only if configured.</p>
      </Section>
    </InformationPage>
  );
}

export function TermsPage() {
  return (
    <InformationPage title="Terms of Use" description="Ground rules for using TuzakAI by Sztuzk’s planning and design tools.">
      <Section title="What the Studio provides">
        <p>TuzakAI by Sztuzk has a public catalog of digital products and AI tools, five legacy browser-based planning tools, and a separate designer at <code>/tuzakai/</code>. The legacy tools can be used without signing in. Root-site account sign-in is provided through Clerk, but it does not sync legacy tool work. In the designer, saved designs are stored through its API and associated with a signed browser cookie, not a Clerk account. The Contact / Support form submits a support ticket to the site API. Paid checkout, order taking and payment processing are not currently available.</p>
      </Section>
      <Section title="Use your own judgment">
        <p>Outputs are examples and estimates for planning, not professional financial, legal, business or investment advice. They do not guarantee a workable design, an accurate price, profit, sales or marketplace results. The legacy tools use rule-based generators; the separate designer may return assistant responses through its API. Review all results before you use or share them.</p>
        <p>You are responsible for checking your materials, measurements, actual costs and fees, prices, tags, product claims, business decisions and current Etsy policies. Only list products and details that you can verify and have the right to use.</p>
      </Section>
      <Section title="Your work and access">
        <p>Legacy-tool projects and drafts stay in local browser storage, not an online account; export work you need to keep. Clearing site data or changing devices may remove your local copy. Designer saved designs use the designer API and the signed browser cookie for that workspace; they are not synced to a Clerk account. Please use the tools lawfully and do not use them to create misleading listings or misuse others’ work. We may change these tools and update these terms.</p>
      </Section>
      <Section title="External services and resources">
        <p>The store catalog is available to browse, but paid checkout and sales fulfillment are not currently available. A published listing does not mean it can be purchased here. Etsy is a separate service with its own rules; the legacy tools create drafts and cannot publish a listing for you.</p>
        <p>For questions about TuzakAI, see <Link href="/contact">Contact / Support</Link>.</p>
      </Section>
    </InformationPage>
  );
}

export function RefundPolicyPage() {
  return (
    <InformationPage title="Refund Policy" description="Current information about refunds and payments on TuzakAI by Sztuzk.">
      <Section title="Checkout is not active">
        <p>Paid checkout, order taking and payment processing are not currently available on this site. The public catalog and product descriptions are for browsing; they do not mean a purchase can be completed here.</p>
      </Section>
      <Section title="No active purchase-specific policy">
        <p>Because checkout is not active, this page does not set a refund period, eligibility rule, refund method, or other purchase promise for a TuzakAI order. No such terms should be inferred from a catalog listing.</p>
      </Section>
      <Section title="Questions about a payment">
        <p>If you believe you were charged in connection with TuzakAI, submit a request through <Link href="/contact">Contact / Support</Link> with enough information for the team to review it. Do not include full payment-card details or passwords. A support request is not a guarantee of a refund or a particular outcome.</p>
        <p>Nothing on this page is intended to limit rights that may apply under the law.</p>
      </Section>
    </InformationPage>
  );
}

export function LicenseTermsPage() {
  return (
    <InformationPage title="License Terms" description="Information about digital product licensing on TuzakAI by Sztuzk.">
      <Section title="No paid digital product license is currently issued here">
        <p>Paid checkout and digital file delivery are not currently active on TuzakAI. A catalog listing or preview is not itself a completed sale, delivered file, or grant of a paid product license. This site has not provided license records to account pages.</p>
      </Section>
      <Section title="Check the terms supplied with an item">
        <p>Where a digital item is obtained from another source, the license or terms that accompany that item and the circumstances of its supply govern its use. Do not assume a license grant, permitted use, exclusivity, resale right, or transfer right from a TuzakAI listing alone.</p>
      </Section>
      <Section title="Tools and submitted work">
        <p>These notes do not replace the <Link href="/terms">Terms of Use</Link> for using this site and its tools, and they do not create a product license for tool outputs. Review generated drafts and estimates before using or sharing them. For a question about a specific item, use <Link href="/contact">Contact / Support</Link>.</p>
      </Section>
    </InformationPage>
  );
}

export function DisclaimerPage() {
  return (
    <InformationPage title="Disclaimer" description="Important checks to make before acting on a TuzakAI result.">
      <Section title="Planning tools, not professional advice">
        <p>The legacy tools’ generated ideas, designs, plans and listings are rule-based creative drafts. The separate designer provides selection-based sketches and planning results. Suggestions are illustrative; none of these tools provides professional financial, legal, business or investment advice or promises success.</p>
      </Section>
      <Section title="Prices and costs">
        <p>Pricing results are estimates for planning purposes only. Enter your actual material, labor, packaging and marketplace costs before setting your final selling price. Check fees, taxes, shipping and other costs that apply to your situation. The calculator cannot know supplier prices or guarantee a margin or profit.</p>
      </Section>
      <Section title="Listings and jewelry details">
        <p>The Etsy Listing Generator makes a draft; it does not publish to Etsy. You must check every price, tag, material, measurement, processing time, product claim and policy against the real item and Etsy’s current requirements before publishing. Suggested tags do not guarantee visibility or sales.</p>
        <p>Check that any jewelry concept is practical and safe for the materials and techniques you use. You are responsible for your own listings, products, prices and business decisions.</p>
      </Section>
      <Section title="Catalog and purchases">
        <p>The site has a browsable catalog but no active paid checkout or sales fulfillment. Published listings are informational until a verified purchase flow is available. Use <Link href="/contact">Contact / Support</Link> to submit a support request; a direct support email appears only if configured.</p>
      </Section>
    </InformationPage>
  );
}