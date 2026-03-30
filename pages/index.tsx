import Link from "next/link";
import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
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
            <a href="#activity">Market Activity</a>
            <a href="#insight">News & Insight</a>
            <a href="#solution">Solution</a>
            <a href="#about">About</a>
          </nav>
          <Link className="primary-button link-button landing-stock-open" href="/login">
            Open App
          </Link>
        </header>

        <section className="landing-stock-hero" id="home">
          <div className="landing-stock-copy">
            <div className="landing-stock-kicker">Understand the market in under 60 seconds</div>
            <h1 className="landing-stock-title">
              Read the market faster.
              <span>Understand what moves next.</span>
            </h1>
            <p className="landing-stock-lead">
              KAIRO turns live stocks, news, and signals into a cleaner investing workspace with plain-English intelligence, market context, and faster decision support.
            </p>
            <div className="landing-stock-actions">
              <Link className="primary-button link-button" href="/signup">
                Start Free
              </Link>
              <Link className="ghost-button link-button" href="/dashboard">
                Try Live Dashboard
              </Link>
            </div>
            <div className="landing-stock-linkrow">
              <a href="#activity">Explore Market Activity</a>
              <a href="#solution">See How It Works</a>
            </div>
          </div>

          <div className="landing-stock-visual">
            <div className="landing-stock-media">
              <div className="landing-stock-browserbar">
                <span />
                <span />
                <span />
                <div className="landing-stock-browserpill">kairo.market</div>
              </div>
              <img src="/kairo-hero.gif" alt="KAIRO market motion backdrop" />
              <div className="landing-stock-chart" aria-hidden="true">
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
              <div className="landing-stock-tag landing-stock-tag-positive">+3.78%</div>
              <div className="landing-stock-tag landing-stock-tag-alert">AI BUY</div>
            </div>
          </div>
        </section>

        <section className="landing-stock-strip" id="activity">
          <div className="landing-stock-strip-head">
            <span>Top market pulse</span>
            <a href="/dashboard">Open live board</a>
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
            <h2>Less noise. Better signal density.</h2>
            <p className="muted-copy">
              KAIRO combines live market boards, chart-driven intelligence, premium watchlists, and collaborative signal rooms inside a faster, darker, more intentional trading environment.
            </p>
          </div>

          <div className="landing-stock-panel landing-stock-panel-subscribe" id="about">
            <div className="eyebrow">Stay close to launch updates</div>
            <h3>Get product drops and platform emails</h3>
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  if (session?.user) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false
      }
    };
  }

  return { props: {} };
};
