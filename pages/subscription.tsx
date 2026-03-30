import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { getUserSubscription } from "@/lib/repository";

const plans = [
  {
    name: "Free",
    price: "$0",
    body: "Open product exploration, signal previews, community browsing, and paper-trading access.",
    bullets: [
      "Browse dashboard, markets, news, and stock research",
      "Preview AI signals before paying",
      "Learn in KAIRO Academy and test ideas in simulation"
    ]
  },
  {
    name: "Pro",
    price: "$39/mo target",
    body: "Full AI signals, unlimited watchlists, portfolio analytics, alerts, and daily brief retention loops.",
    bullets: [
      "Full buy, hold, and sell reasoning",
      "Daily brief, signal-change alerts, and saved AI chat history",
      "Unlimited watchlists and deeper stock analysis"
    ]
  },
  {
    name: "Pro+",
    price: "$99/mo roadmap",
    body: "Advanced portfolio doctor workflows, richer earnings workflows, and premium strategy rooms.",
    bullets: [
      "Portfolio concentration and risk review",
      "Premium community and advanced coaching",
      "Higher-touch analysis for serious users"
    ]
  }
];

export default function SubscriptionPage({
  premium,
  subscriptionStatus,
  checkoutState,
  signedIn
}: {
  premium: boolean;
  subscriptionStatus: string | null;
  checkoutState: string | null;
  signedIn: boolean;
}) {
  const [isPremium] = useState(premium);
  const [status] = useState(subscriptionStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function openBillingFlow(path: "/api/stripe/checkout" | "/api/stripe/portal") {
    setLoading(true);
    setMessage(null);

    if (!signedIn) {
      window.location.href = "/login";
      return;
    }

    const response = await fetch(path, {
      method: "POST"
    });
    const data = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;

    if (response.ok && data?.url) {
      window.location.href = data.url;
      return;
    }

    setMessage(data?.error ?? "Unable to start billing right now. Check your Stripe configuration and try again.");
    setLoading(false);
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="eyebrow">Plans</div>
        <h1>KAIRO plans for learning, research, and better investing workflows</h1>
        <p className="muted-copy">
          Start with the free experience to learn the platform, explore signals, and build confidence. Upgrade when you want saved workflows, deeper analysis, alerts, and richer portfolio tools.
        </p>
        {checkoutState === "success" ? <p className="success-copy">Stripe checkout completed. Premium access will update as soon as the webhook confirms your subscription.</p> : null}
        {checkoutState === "canceled" ? <p className="muted-copy">Stripe checkout was canceled. Your account is still on the free plan.</p> : null}
        {message ? <p className="error-copy">{message}</p> : null}
        {status ? <p className="muted-copy">Current subscription status: {status}</p> : null}
      </section>

      <div className="card-grid">
        {plans.map((plan) => (
          <div key={plan.name} className="panel tier-card">
            <div className="eyebrow">{plan.name}</div>
            <h2>{plan.price}</h2>
            <p className="muted-copy">{plan.body}</p>
            <div className="lesson-list">
              {plan.bullets.map((bullet) => (
                <div key={bullet} className="lesson-card">
                  <p className="muted-copy">{bullet}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="card-grid">
        <div className="panel tier-card">
          <div className="eyebrow">Current checkout</div>
          <h2>{isPremium ? "Manage billing" : "Upgrade with Stripe"}</h2>
          <p className="muted-copy">
            Stripe handles the payment flow securely. The exact live price shown at checkout comes from your configured Stripe price in production.
          </p>
          <button
            className="primary-button"
            disabled={loading}
            onClick={() => openBillingFlow(isPremium ? "/api/stripe/portal" : "/api/stripe/checkout")}
          >
            {loading ? "Opening..." : isPremium ? "Manage Billing" : "Upgrade to Premium"}
          </button>
          <p className="muted-copy">
            {isPremium
              ? "Your premium access stays in sync with Stripe subscription events."
              : "Checkout opens in Stripe and premium access activates after Stripe confirms payment."}
          </p>
        </div>
        <div className="panel tier-card">
          <div className="eyebrow">Why upgrade</div>
          <h2>Move from exploration to a full investing workspace</h2>
          <p className="muted-copy">
            Premium is for users who want more than just a market snapshot. It unlocks the deeper AI reasoning layer, saved research flows, richer alerts, and stronger portfolio guidance.
          </p>
          <div className="success-banner">
            KAIRO’s mission is to make financial literacy, investing education, and market analysis more accessible to everyday users.
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);
  const subscription = session?.user ? await getUserSubscription(session.user.id) : null;

  return {
    props: {
      session,
      premium: session?.user?.premium ?? false,
      subscriptionStatus: subscription?.status ?? null,
      checkoutState: typeof context.query.checkout === "string" ? context.query.checkout : null,
      signedIn: Boolean(session?.user)
    }
  };
};
