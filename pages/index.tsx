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
    <div className="landing landing-future">
      <div className="landing-noise" aria-hidden="true" />
      <div className="landing-orb landing-orb-one" aria-hidden="true" />
      <div className="landing-orb landing-orb-two" aria-hidden="true" />
      <div className="landing-gridline" aria-hidden="true" />

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="landing-kicker">KAIRO // adaptive market cognition</div>
          <KairoLogo size="lg" stacked />
          <h1 className="landing-title">
            A signal system for the next market cycle.
          </h1>
          <p className="landing-lead">
            KAIRO turns price action, market structure, and headline flow into a cleaner trading surface with live boards, AI signals, portfolio simulation, and premium collaboration.
          </p>
          <div className="landing-chip-row">
            <span className="landing-chip">Live quote matrix</span>
            <span className="landing-chip">AI signal engine</span>
            <span className="landing-chip">Premium research rooms</span>
          </div>
          <div className="landing-actions">
            <Link className="primary-button link-button landing-primary" href="/signup">
              Enter KAIRO
            </Link>
            <Link className="ghost-button link-button landing-secondary" href="/login">
              Existing account
            </Link>
          </div>
        </div>

        <div className="landing-visual panel">
          <div className="landing-visual-top">
            <span className="landing-node">signal lattice</span>
            <span className="landing-node">live mode</span>
          </div>
          <div className="landing-spectrum" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="landing-visual-grid">
            <article className="landing-metric-card">
              <small>MSFT / live structure</small>
              <strong>BUY</strong>
              <span>Uptrend, constructive news tone, strong relative momentum.</span>
            </article>
            <article className="landing-metric-card">
              <small>NVDA / board pulse</small>
              <strong>+2.84%</strong>
              <span>Real-time board refresh and watchlist-first monitoring.</span>
            </article>
            <article className="landing-metric-card landing-metric-card-accent">
              <small>premium layer</small>
              <strong>Full AI reasoning</strong>
              <span>Deeper trend context, signal confidence, groups, and simulator guidance.</span>
            </article>
          </div>
        </div>
      </section>

      <section className="landing-band">
        <div className="landing-stat">
          <strong>15s</strong>
          <span>live board refresh rhythm</span>
        </div>
        <div className="landing-stat">
          <strong>AI</strong>
          <span>signals layered over market structure</span>
        </div>
        <div className="landing-stat">
          <strong>Free + Premium</strong>
          <span>clean entry path with upgrade depth</span>
        </div>
      </section>

      <section className="landing-lower">
        <div className="landing-story panel">
          <div className="eyebrow">Why it feels different</div>
          <h2>Built like a trading interface, not a generic finance landing page.</h2>
          <p className="muted-copy">
            The experience is designed around motion, signal density, and faster pattern recognition. KAIRO gives you live boards, sharper watchlists, cleaner headlines, and a visual system that feels intentional instead of interchangeable.
          </p>
        </div>

        <div className="marketing-box landing-subscribe panel">
          <div className="eyebrow">Launch updates</div>
          <h3>Get product drops and platform updates</h3>
          <div className="landing-actions landing-subscribe-row">
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
