import type { NextApiRequest, NextApiResponse } from "next";
import { createVerificationToken, upsertAudienceMember } from "@/lib/repository";
import { sendVerificationEmail } from "@/lib/email";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { email, marketingOptIn, productUpdatesOptIn } = req.body as {
    email?: string;
    marketingOptIn?: boolean;
    productUpdatesOptIn?: boolean;
  };

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email is required." });
  }

  await upsertAudienceMember({
    email,
    marketingOptIn: Boolean(marketingOptIn),
    productUpdatesOptIn: Boolean(productUpdatesOptIn),
    source: "marketing-form",
    verifiedAt: null
  });

  const token = await createVerificationToken(email);
  const verification = await sendVerificationEmail(email, token.token, req);

  return res.status(200).json({
    ok: true,
    message: verification.sent
      ? "Subscription received. Please verify your email to receive future updates."
      : `Local verification link: ${verification.verifyUrl}`
  });
}
