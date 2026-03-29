import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    error: "Direct premium toggles are disabled. Use /api/stripe/checkout and Stripe webhooks to manage subscriptions."
  });
}
