import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { getUserSubscription, upsertStripeSubscriptionForUser } from "@/lib/repository";
import { getBaseUrl, getStripe, getStripePriceId } from "@/lib/stripe";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const session = await getApiSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const stripe = getStripe();
    const priceId = getStripePriceId();
    const appUrl = getBaseUrl();
    const existingSubscription = await getUserSubscription(session.user.id);

    let customerId = existingSubscription?.customerId ?? null;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name ?? undefined,
        metadata: {
          userId: String(session.user.id)
        }
      });
      customerId = customer.id;
    }

    await upsertStripeSubscriptionForUser({
      userId: session.user.id,
      customerId,
      priceId,
      status: existingSubscription?.status ?? "checkout_pending",
      currentPeriodEnd: existingSubscription?.currentPeriodEnd ?? null
    });

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: String(session.user.id),
      success_url: `${appUrl}/subscription?checkout=success`,
      cancel_url: `${appUrl}/subscription?checkout=canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          userId: String(session.user.id)
        }
      },
      metadata: {
        userId: String(session.user.id)
      }
    });

    return res.status(200).json({ url: checkoutSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to start Stripe checkout.";
    return res.status(500).json({ error: message });
  }
}
