import { ArrowRight, CircleHelp, LifeBuoy, MessageSquareText, UserRound } from 'lucide-react';
import { PageHeading, SiteLink as Link } from '../components/site';

export function HelpCenterPage() {
  return (
    <div className="container" style={{ paddingBottom: 100 }}>
      <PageHeading
        kicker="TUZAKAI SUPPORT"
        title="Help center"
        description="Find a quick answer, learn how the tools work, or send a support request."
      />
      <div className="feature-grid" style={{ alignItems: 'stretch' }}>
        <section className="card tool-panel">
          <CircleHelp size={24} color="#9e7650" strokeWidth={1.4} />
          <h2 className="serif" style={{ fontSize: 27 }}>Start with the FAQ</h2>
          <p className="muted" style={{ lineHeight: 1.8 }}>
            See answers about available tools, browser-saved work, estimates, and the current checkout status.
          </p>
          <Link href="/faq" className="link-arrow">Read frequently asked questions <ArrowRight size={15} /></Link>
        </section>
        <section className="card tool-panel">
          <MessageSquareText size={24} color="#9e7650" strokeWidth={1.4} />
          <h2 className="serif" style={{ fontSize: 27 }}>Contact / Support</h2>
          <p className="muted" style={{ lineHeight: 1.8 }}>
            Use the support form to submit a question for review. Submitted requests are saved for administrator review; the form does not send an email confirmation, and a direct support email is shown only if configured.
          </p>
          <Link href="/contact" className="link-arrow">Open Contact / Support <ArrowRight size={15} /></Link>
        </section>
        <section className="card tool-panel">
          <UserRound size={24} color="#9e7650" strokeWidth={1.4} />
          <h2 className="serif" style={{ fontSize: 27 }}>Account help</h2>
          <p className="muted" style={{ lineHeight: 1.8 }}>
            Sign in to view your account. Purchase and license records are not currently provided to account pages, and paid checkout is not active.
          </p>
          <Link href="/account" className="link-arrow">Go to your account <ArrowRight size={15} /></Link>
        </section>
      </div>
      <section className="quiet-panel" style={{ marginTop: 28, maxWidth: 850 }}>
        <LifeBuoy size={22} color="#9e7650" strokeWidth={1.4} />
        <h2 className="serif" style={{ fontSize: 27, marginBottom: 8 }}>A few useful things to know</h2>
        <ul className="muted" style={{ lineHeight: 1.9, paddingLeft: 22 }}>
          <li>The five original Studio tools keep drafts and saved projects in this browser. Export work you want to keep before clearing browser data.</li>
          <li>Signing in with Clerk does not sync the original Studio’s browser-local work.</li>
          <li>Saved designs in the separate Jewelry Designer use its browser workspace and are not linked to your TuzakAI account.</li>
          <li>Tool results are drafts or estimates to review; the pricing and business tools do not guarantee outcomes.</li>
        </ul>
        <p className="fine" style={{ marginBottom: 0 }}>For details about how site information is handled, see the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link>.</p>
      </section>
    </div>
  );
}