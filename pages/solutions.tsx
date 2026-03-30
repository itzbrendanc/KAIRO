import Link from "next/link";
import { KairoLogo } from "@/components/branding/kairo-logo";

const starterSteps = [
  {
    title: "Start with market structure",
    body: "Learn what the major indices, sectors, and large-cap leaders are doing before you focus on one stock. Context usually matters more than one isolated candle."
  },
  {
    title: "Build a watchlist with intent",
    body: "Track a small set of names you can actually learn. It is better to know 10 stocks deeply than to vaguely follow 200."
  },
  {
    title: "Use paper trades first",
    body: "Practice entries, exits, and position sizing in simulation mode so your first lessons are not paid for with real capital."
  },
  {
    title: "Journal every trade idea",
    body: "Write why you entered, what invalidates the idea, and what would make you add or exit. This is how skill compounds."
  }
];

const strategies = [
  {
    title: "Long-term investing",
    body: "This approach focuses on durable businesses, broad ETFs, and compounding over years. Investors usually care more about quality, earnings power, and valuation than short-term momentum."
  },
  {
    title: "Swing trading",
    body: "Swing traders hold for days to weeks and often use support, resistance, moving averages, and earnings or macro catalysts to time entries."
  },
  {
    title: "Momentum trading",
    body: "Momentum traders look for strong names already moving with volume and trend confirmation. The goal is to participate while strength lasts, while controlling risk tightly."
  },
  {
    title: "Value investing",
    body: "Value investors search for stocks trading below what they believe the business is worth. This often means patience, financial statement work, and a longer time horizon."
  }
];

const stockTypes = [
  {
    title: "Index ETFs",
    body: "Funds like SPY or QQQ give broad exposure and are often the easiest place for beginners to start because they reduce single-company risk."
  },
  {
    title: "Growth stocks",
    body: "These companies often reinvest heavily and trade on future expectations. They can move fast, which means more upside and more volatility."
  },
  {
    title: "Dividend stocks",
    body: "These are often mature businesses that return capital to shareholders. They can help investors who care about stability and income."
  },
  {
    title: "Defensive stocks",
    body: "Healthcare, staples, and some utilities can hold up better when the economy slows because demand is steadier."
  }
];

export default function SolutionsPage() {
  return (
    <div className="page stack public-page">
      <section className="panel public-hero">
        <KairoLogo size="sm" />
        <div className="eyebrow">Solutions</div>
        <h1>Learn how to trade, invest, and build a process</h1>
        <p className="muted-copy">
          This is the learning side of KAIRO: beginner guidance, trading lessons, investing strategy overviews, and practical explanations of what different categories of stocks actually mean.
        </p>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Getting started</div>
            <h2>How a new investor should begin</h2>
            <p className="muted-copy">
              These lessons are designed to help a new user move from curiosity to a disciplined learning process instead of jumping straight into random trades.
            </p>
          </div>
        </div>
        <div className="card-grid">
          {starterSteps.map((item) => (
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
              <div className="eyebrow">Strategies</div>
              <h2>Different investing styles</h2>
              <p className="muted-copy">
                Not every person should trade the same way. These strategy blocks explain the basic logic behind several common styles so users can find the one that matches their temperament.
              </p>
            </div>
          </div>
          <div className="lesson-list">
            {strategies.map((item) => (
              <div key={item.title} className="lesson-card">
                <strong>{item.title}</strong>
                <p className="muted-copy">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Stock categories</div>
              <h2>What different stocks are</h2>
              <p className="muted-copy">
                Stocks and ETFs behave differently depending on the business type, risk profile, and reason investors own them. This section helps users understand the difference.
              </p>
            </div>
          </div>
          <div className="lesson-list">
            {stockTypes.map((item) => (
              <div key={item.title} className="lesson-card">
                <strong>{item.title}</strong>
                <p className="muted-copy">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel premium-strip">
        <div>
          <div className="eyebrow">Practice inside KAIRO</div>
          <h2>Take the lessons into the simulator</h2>
          <p className="muted-copy">
            Once users understand the basics, they can move into KAIRO’s paper-trading area to practice position sizing, journaling, and strategy discipline without risking real money.
          </p>
        </div>
        <div className="button-row">
          <Link className="primary-button link-button" href="/portfolio">
            Open Paper Trading
          </Link>
          <Link className="ghost-button link-button" href="/launch-plan">
            View launch plan
          </Link>
        </div>
      </section>
    </div>
  );
}
