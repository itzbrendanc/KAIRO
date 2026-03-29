import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { getUserSubscription } from "@/lib/repository";

export default function SubscriptionPage({
  premium,
  subscriptionStatus,
  checkoutState
}: {
  premium: boolean;
  subscriptionStatus: string | null;
  checkoutState: string | null;
}) {
  const [isPremium] = useState(premium);
  const [status] = useState(subscriptionStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function openBillingFlow(path: "/api/stripe/checkout" | "/api/stripe/portal") {
    setLoading(true);
    setMessage(null);

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
        <h1>KAIRO Free and Premium</h1>
        <p className="muted-copy">
          Premium unlocks more AI signals, historical trend access, and full AI analysis. Stripe handles payment collection securely and the backend updates your premium access after Stripe confirms the subscription.
        </p>
        {checkoutState === "success" ? <p className="success-copy">Stripe checkout completed. Premium access will update as soon as the webhook confirms your subscription.</p> : null}
        {checkoutState === "canceled" ? <p className="muted-copy">Stripe checkout was canceled. Your account is still on the free plan.</p> : null}
        {message ? <p className="error-copy">{message}</p> : null}
        {status ? <p className="muted-copy">Current subscription status: {status}</p> : null}
      </section>

      <div className="card-grid">
        <div className="panel">
          <div className="eyebrow">Free</div>
          <h2>$0</h2>
          <p className="muted-copy">Dashboard access, watchlists, market news, and preview AI signals.</p>
        </div>
        <div className="panel">
          <div className="eyebrow">Premium</div>
          <h2>$24/mo</h2>
          <p className="muted-copy">Full signal explanations, historical trends, portfolio insights, and premium subscriber workflows.</p>
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
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

  const subscription = await getUserSubscription(session.user.id);

  return {
    props: {
      session,
      premium: session.user.premium,
      subscriptionStatus: subscription?.status ?? null,
      checkoutState: typeof context.query.checkout === "string" ? context.query.checkout : null
    }
  };
};
