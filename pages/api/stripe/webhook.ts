import { buffer } from "node:stream/consumers";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import {
  findUserById,
  updateStripeSubscriptionByCustomerId,
  upsertStripeSubscriptionForUser
} from "@/lib/repository";
import { getStripe } from "@/lib/stripe";

export const config = {
  api: {
    bodyParser: false
  }
};

function getSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price.id ?? null;
}

function getSubscriptionPeriodEnd(subscription: Stripe.Subscription) {
  const currentPeriodEnd = (
    subscription as Stripe.Subscription & {
      current_period_end?: number;
    }
  ).current_period_end;

  return currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const signature = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return res.status(400).json({ error: "Stripe webhook is not configured." });
  }

  try {
    const payload = await buffer(req);
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = Number(session.client_reference_id || session.metadata?.userId);

      if (session.mode === "subscription" && userId && session.customer) {
        let subscriptionStatus = "incomplete";
        let subscriptionId: string | null = null;
        let priceId: string | null = null;
        let currentPeriodEnd: Date | null = null;

        if (typeof session.subscription === "string") {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          subscriptionStatus = subscription.status;
          subscriptionId = subscription.id;
          priceId = getSubscriptionPriceId(subscription);
          currentPeriodEnd = getSubscriptionPeriodEnd(subscription);
        }

        await upsertStripeSubscriptionForUser({
          userId,
          customerId: String(session.customer),
          subscriptionId,
          priceId,
          status: subscriptionStatus,
          currentPeriodEnd
        });
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const userId = Number(subscription.metadata?.userId);

      const updated = await updateStripeSubscriptionByCustomerId({
        customerId,
        subscriptionId: subscription.id,
        priceId: getSubscriptionPriceId(subscription),
        status: subscription.status,
        currentPeriodEnd: getSubscriptionPeriodEnd(subscription)
      });

      if (!updated && userId) {
        const user = await findUserById(userId);
        if (user) {
          await upsertStripeSubscriptionForUser({
            userId,
            customerId,
            subscriptionId: subscription.id,
            priceId: getSubscriptionPriceId(subscription),
            status: subscription.status,
            currentPeriodEnd: getSubscriptionPeriodEnd(subscription)
          });
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed.";
    return res.status(400).json({ error: message });
  }
}
