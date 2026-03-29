import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { getBaseUrl, getStripe } from "@/lib/stripe";
import { getUserSubscription } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const session = await getApiSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  try {
    const subscription = await getUserSubscription(session.user.id);
    if (!subscription?.customerId) {
      return res.status(400).json({ error: "No Stripe customer found for this user." });
    }

    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.customerId,
      return_url: `${getBaseUrl()}/subscription`
    });

    return res.status(200).json({ url: portalSession.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open Stripe billing portal.";
    return res.status(500).json({ error: message });
  }
}
