import Link from "next/link";
import { useState } from "react";
import { KairoLogo } from "@/components/branding/kairo-logo";

export default function Home() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function subscribe() {
    const response = await fetch("/api/marketing/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        marketingOptIn: true,
        productUpdatesOptIn: true
      })
    });
    const payload = await response.json();
    setMessage(payload.message ?? "Thanks for subscribing.");
  }

  return (
    <div className="landing landing-stock">
      <div className="landing-stock-glow" aria-hidden="true" />
      <div className="landing-stock-orb landing-stock-orb-left" aria-hidden="true" />
      <div className="landing-stock-orb landing-stock-orb-right" aria-hidden="true" />
      <div className="landing-stock-shell">
        <header className="landing-stock-nav">
          <div className="landing-stock-brand">
            <KairoLogo size="sm" />
          </div>
          <nav className="landing-stock-links">
            <a href="#home">Home</a>
            <Link href="/market-activity">Market Activity</Link>
            <Link href="/news-insight">News & Insight</Link>
            <Link href="/solutions">Solutions</Link>
            <Link href="/chat">AI Chat</Link>
            <a href="#about">About</a>
          </nav>
          <Link className="primary-button link-button landing-stock-open" href="/dashboard">
            Explore Live App
          </Link>
        </header>

        <section className="landing-stock-hero" id="home">
          <div className="landing-stock-copy">
            <div className="landing-stock-floating-words" aria-hidden="true">
              <span>Signals</span>
              <span>Momentum</span>
              <span>Alpha</span>
              <span>Macro</span>
              <span>Risk</span>
              <span>Earnings</span>
            </div>
            <div className="landing-stock-kicker">Understand the market in under 60 seconds</div>
            <h1 className="landing-stock-title">
              Read the market faster.
              <span>Understand what moves next.</span>
            </h1>
            <p className="landing-stock-lead">
              KAIRO turns live stocks, news, and signals into a cleaner investing workspace with plain-English intelligence, market context, and faster decision support.
            </p>
            <div className="landing-stock-actions">
              <Link className="primary-button link-button" href="/dashboard">
                Open Live Dashboard
              </Link>
              <Link className="ghost-button link-button" href="/chat">
                Chat With AI
              </Link>
            </div>
            <div className="landing-stock-linkrow">
              <Link href="/market-activity">Explore Market Activity</Link>
              <Link href="/stocks/AAPL">Open Stock Research</Link>
              <Link href="/solutions">See How It Works</Link>
            </div>
          </div>

          <div className="landing-stock-visual">
            <div className="landing-stock-media">
              <div className="landing-stock-demo">
                <div className="landing-stock-browserbar">
                  <span />
                  <span />
                  <span />
                  <div className="landing-stock-browserpill">kairo.market</div>
                </div>
                <div className="landing-stock-demo-screen">
                  <img src="/kairo-hero.gif" alt="KAIRO product walkthrough animation" />
                  <div className="landing-stock-demo-copy">
                    <div className="landing-stock-demo-label">How it works</div>
                    <strong>Upload context. Track markets. Read the signal.</strong>
                  </div>
                </div>
              </div>

              <div className="landing-stock-chart-card">
                <div className="landing-stock-chart-head">
                  <div>
                    <div className="landing-stock-demo-label">Live chart</div>
                    <strong>Signal momentum stream</strong>
                  </div>
                  <div className="landing-stock-tag landing-stock-tag-positive">+3.78%</div>
                </div>
                <div className="landing-stock-chart-grid" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
                <div className="landing-stock-card landing-stock-card-main">
                  <div className="landing-stock-card-icon">K</div>
                  <div className="landing-stock-card-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <div className="landing-stock-tag landing-stock-tag-alert">AI BUY</div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-stock-strip" id="activity">
          <div className="landing-stock-strip-head">
            <span>Top market pulse</span>
            <Link href="/market-activity">Open market activity</Link>
          </div>
          <div className="landing-stock-tickers">
            <article className="landing-stock-ticker">
              <strong>S&amp;P Futures</strong>
              <span>5,274.8</span>
              <small className="positive">+18.7 (0.57%)</small>
            </article>
            <article className="landing-stock-ticker">
              <strong>Nasdaq</strong>
              <span>17,158.8</span>
              <small className="positive">+24.7 (0.28%)</small>
            </article>
            <article className="landing-stock-ticker">
              <strong>EUR/USD</strong>
              <span>1.0856</span>
              <small className="negative">-0.0045 (0.02%)</small>
            </article>
            <article className="landing-stock-ticker">
              <strong>Bitcoin</strong>
              <span>68,420</span>
              <small className="positive">+782.4 (1.16%)</small>
            </article>
            <article className="landing-stock-ticker">
              <strong>NVDA</strong>
              <span>Live AI Signal</span>
              <small className="positive">BUY / momentum active</small>
            </article>
          </div>
        </section>

        <section className="landing-stock-bottom" id="solution">
          <div className="landing-stock-panel">
            <div className="eyebrow">Built for confidence</div>
            <h2>Explore the product by workflow</h2>
            <div className="lesson-list">
              <Link href="/market-activity" className="lesson-card">
                <strong>Market Activity</strong>
                <p className="muted-copy">
                  See the KAIRO market universe in one large display with stocks, index ETFs, sector groups, and fast-refreshing board data.
                </p>
              </Link>
              <Link href="/news-insight" className="lesson-card">
                <strong>News & Insight</strong>
                <p className="muted-copy">
                  Read the most important live headlines across tracked names, ranked to surface the stories most likely to move markets.
                </p>
              </Link>
              <Link href="/solutions" className="lesson-card">
                <strong>Solutions</strong>
                <p className="muted-copy">
                  Learn how to start trading, understand investing styles, and study different stock categories before risking real capital.
                </p>
              </Link>
              <Link href="/academy" className="lesson-card">
                <strong>KAIRO Academy</strong>
                <p className="muted-copy">
                  Follow a step-by-step lesson path with native KAIRO lessons covering market basics, money management, and professional-style trading process.
                </p>
              </Link>
              <Link href="/signals" className="lesson-card">
                <strong>AI Signals</strong>
                <p className="muted-copy">
                  Browse buy, hold, and sell calls across the tracked market universe without signing in. Sign in only if you want to save your workflow.
                </p>
              </Link>
              <Link href="/chat" className="lesson-card">
                <strong>Ask KAIRO AI</strong>
                <p className="muted-copy">
                  Use the assistant like ChatGPT to ask about stocks, strategy, risk, indicators, and what is moving markets right now.
                </p>
              </Link>
              <Link href="/community" className="lesson-card">
                <strong>Community</strong>
                <p className="muted-copy">
                  Explore study groups and market discussions first. Sign in only when you want to post, personalize, or build a saved profile.
                </p>
              </Link>
              <Link href="/portfolio" className="lesson-card">
                <strong>Paper Trading</strong>
                <p className="muted-copy">
                  Practice trades, study your journal, and learn money management before ever upgrading or committing real capital.
                </p>
              </Link>
            </div>
          </div>

          <div className="landing-stock-panel landing-stock-panel-subscribe" id="about">
            <div className="eyebrow">Stay close to launch updates</div>
            <h3>Get product drops and platform emails</h3>
            <p className="muted-copy">
              You can browse KAIRO without an account. Sign in only when you want to save a personal watchlist, keep your chat history, or upgrade with Stripe.
            </p>
            <div className="landing-stock-actions landing-stock-subscribe-row">
              <input
                className="text-input"
                placeholder="Email for updates"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <button className="primary-button" onClick={subscribe}>Subscribe</button>
            </div>
            {message ? <div className="success-banner">{message}</div> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
