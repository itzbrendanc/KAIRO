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
    <div className="landing">
      <div className="landing-card panel">
        <KairoLogo size="lg" stacked />
        <div className="eyebrow">Signal-first terminal</div>
        <h1>AI-powered market intelligence for modern investors.</h1>
        <p className="hero-copy">
          Follow market leaders, read AI trade intelligence, and monitor curated market news from a single KAIRO dashboard.
        </p>
        <div className="landing-chip-row">
          <span className="landing-chip">Black + gold trading UI</span>
          <span className="landing-chip">Live signal board</span>
          <span className="landing-chip">Free and premium tiers</span>
        </div>
        <div className="landing-actions">
          <Link className="primary-button link-button" href="/signup">
            Create account
          </Link>
          <Link className="ghost-button link-button" href="/login">
            Sign in
          </Link>
        </div>
        <div className="marketing-box">
          <h3>Get product updates and launch emails</h3>
          <div className="landing-actions">
            <input className="text-input" placeholder="Email for updates" value={email} onChange={(event) => setEmail(event.target.value)} />
            <button className="primary-button" onClick={subscribe}>Subscribe</button>
          </div>
          {message ? <div className="success-banner">{message}</div> : null}
        </div>
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
