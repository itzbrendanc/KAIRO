import Link from "next/link";
import { KairoLogo } from "@/components/branding/kairo-logo";

const trustPillars = [
  {
    title: "AI research, not personal financial advice",
    body: "KAIRO is an educational decision-support product. It summarizes signals, indicators, and market catalysts, but it is not a personalized advisory service and should not be presented that way."
  },
  {
    title: "Explain every signal clearly",
    body: "Buy, hold, and sell calls should always connect back to visible evidence such as trend, RSI, momentum, earnings, and news sentiment so the product earns trust instead of hiding behind mystery."
  },
  {
    title: "Retention through clarity, not hype",
    body: "The goal is to make users return for daily market briefs, cleaner workflows, and better decision context, not to manufacture urgency or promise unrealistic outcomes."
  }
];

const disclosures = [
  "All market content is for educational and informational purposes only.",
  "AI-generated signals may be wrong, delayed, incomplete, or unsuitable for a user’s objectives.",
  "KAIRO does not guarantee profits, performance, or specific investing outcomes.",
  "Users should do their own research and consider licensed professional advice before acting.",
  "Paper trading, hypothetical examples, and historical simulations are not guarantees of future performance."
];

const buildTrust = [
  "Label the source of quotes, headlines, and earnings data clearly.",
  "Show when live data is unavailable instead of silently filling gaps with fake certainty.",
  "Keep disclaimers visible on the homepage, subscription page, and stock research pages.",
  "Use plain-English reasoning so beginners can understand why a signal changed.",
  "Document the methodology for how KAIRO scores buy, hold, and sell ideas."
];

export default function TrustPage() {
  return (
    <div className="page stack public-page">
      <section className="panel public-hero">
        <KairoLogo size="sm" />
        <div className="eyebrow">Trust and legal</div>
        <h1>Build KAIRO like a durable business, not a hype machine</h1>
        <p className="muted-copy">
          Strong trust design increases conversion, referrals, and retention. This page defines how KAIRO should talk about signals, risk, disclosures, and user expectations.
        </p>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Core posture</div>
            <h2>What KAIRO is and is not</h2>
          </div>
        </div>
        <div className="card-grid">
          {trustPillars.map((item) => (
            <div key={item.title} className="lesson-card">
              <strong>{item.title}</strong>
              <p className="muted-copy">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Required disclaimers</div>
              <h2>What should appear across the product</h2>
            </div>
          </div>
          <div className="lesson-list">
            {disclosures.map((item) => (
              <div key={item} className="lesson-card">
                <p className="muted-copy">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Trust system</div>
              <h2>How KAIRO should earn retention</h2>
            </div>
          </div>
          <div className="lesson-list">
            {buildTrust.map((item) => (
              <div key={item} className="lesson-card">
                <p className="muted-copy">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel premium-strip">
        <div>
          <div className="eyebrow">Turn trust into growth</div>
          <h2>Use clarity as a conversion asset</h2>
          <p className="muted-copy">
            Honest data labels, visible disclaimers, and transparent methodology make the product feel safer to try and easier to recommend. That trust compounds into stronger activation and lower churn.
          </p>
        </div>
        <div className="button-row">
          <Link className="primary-button link-button" href="/subscription">
            See pricing
          </Link>
          <Link className="ghost-button link-button" href="/launch-plan">
            Open launch plan
          </Link>
        </div>
      </section>
    </div>
  );
}
