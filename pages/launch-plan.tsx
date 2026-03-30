import Link from "next/link";
import { KairoLogo } from "@/components/branding/kairo-logo";

const differentiators = [
  "Personal watchlist-first AI signals instead of generic market commentary",
  "Behavioral trading coach that flags overtrading, weak exits, and FOMO patterns",
  "Daily brief that tells users what changed in their names, not just what happened broadly",
  "Signal change logs that explain why a rating moved from buy to hold or hold to sell",
  "Paper trading, journaling, and lessons inside the same product loop"
];

const pricing = [
  {
    title: "Free",
    price: "$0",
    body: "Open dashboard browsing, AI signal previews, community reading, one saved watchlist, and paper-trading exploration."
  },
  {
    title: "Pro",
    price: "$39/mo",
    body: "Full AI signals, unlimited watchlists, daily brief, saved chat history, portfolio analytics, and full stock research."
  },
  {
    title: "Pro+",
    price: "$99/mo",
    body: "Portfolio doctor, advanced earnings workflows, premium rooms, and deeper AI coaching for serious users."
  }
];

const roadmap = [
  {
    title: "Week 1",
    body: "Tighten onboarding, pricing, trust pages, signal explanations, and daily retention loops so the core product is credible and useful."
  },
  {
    title: "Week 2",
    body: "Run a 20-user beta, fix confusion fast, and add simple analytics for signup, activation, conversion, and retention."
  },
  {
    title: "Week 3",
    body: "Launch publicly with short-form content, a free tier, and clear upgrade prompts tied to alerts, portfolio tools, and deeper AI analysis."
  },
  {
    title: "Week 4",
    body: "Scale content, launch referrals, send daily and weekly email loops, and double down on the hooks that actually activate users."
  }
];

const growthIdeas = [
  "Post 2 TikToks or Reels per day based on current signal changes and market setups.",
  "Drive users into the live dashboard before asking for signup so the product sells itself.",
  "Offer a 7-day trial or launch discount to convert activated free users.",
  "Send a daily email brief that links directly back into a user’s watchlist.",
  "Use community, lessons, and paper trading to form a durable daily habit."
];

export default function LaunchPlanPage() {
  return (
    <div className="page stack public-page">
      <section className="panel public-hero">
        <KairoLogo size="sm" />
        <div className="eyebrow">Founder launch plan</div>
        <h1>Shape KAIRO into a realistic $10k MRR product</h1>
        <p className="muted-copy">
          This page turns the strategy into an operating system for a solo founder: pricing, differentiation, launch sequencing, and retention loops that can actually be executed.
        </p>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">1 of 1</div>
              <h2>What should make KAIRO special</h2>
            </div>
          </div>
          <div className="lesson-list">
            {differentiators.map((item) => (
              <div key={item} className="lesson-card">
                <p className="muted-copy">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Revenue model</div>
              <h2>Simple pricing math</h2>
            </div>
          </div>
          <div className="card-grid">
            {pricing.map((tier) => (
              <div key={tier.title} className="lesson-card">
                <strong>{tier.title}</strong>
                <div className="plan-price">{tier.price}</div>
                <p className="muted-copy">{tier.body}</p>
              </div>
            ))}
          </div>
          <div className="success-banner">
            <strong>Target math:</strong> 180 Pro users at $39 = $7,020 MRR. 30 Pro+ users at $99 = $2,970 MRR. Total = $9,990 MRR, so one more Pro user takes the business over $10k.
          </div>
        </div>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">30-day roadmap</div>
            <h2>How a solo founder should execute</h2>
          </div>
        </div>
        <div className="card-grid">
          {roadmap.map((item) => (
            <div key={item.title} className="lesson-card">
              <strong>{item.title}</strong>
              <p className="muted-copy">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Growth engine</div>
            <h2>Practical loops that can compound</h2>
          </div>
        </div>
        <div className="lesson-list">
          {growthIdeas.map((item) => (
            <div key={item} className="lesson-card">
              <p className="muted-copy">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="panel premium-strip">
        <div>
          <div className="eyebrow">Use this inside the app</div>
          <h2>Convert browsing into habit, then subscription</h2>
          <p className="muted-copy">
            Let people explore first. Convert them once they save a watchlist, start using the daily brief, and want deeper AI reasoning, alerts, and portfolio analysis.
          </p>
        </div>
        <div className="button-row">
          <Link className="primary-button link-button" href="/dashboard">
            Open dashboard
          </Link>
          <Link className="ghost-button link-button" href="/subscription">
            Review pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
