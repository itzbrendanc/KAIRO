import type { NextApiRequest, NextApiResponse } from "next";
import { markUserVerified, consumeVerificationToken, findUserByEmail, upsertAudienceMember } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed." });
    }

    const token = typeof req.query.token === "string" ? req.query.token : "";

    if (!token) {
      return res.redirect("/login?verified=missing");
    }

    const record = await consumeVerificationToken(token);
    if (!record) {
      return res.redirect("/login?verified=invalid");
    }

    await markUserVerified(record.email);
    const fullUser = await findUserByEmail(record.email);

    if (fullUser) {
      await upsertAudienceMember({
        email: fullUser.email,
        userId: fullUser.id,
        marketingOptIn: fullUser.marketingOptIn,
        productUpdatesOptIn: fullUser.productUpdatesOptIn,
        source: "email-verified",
        verifiedAt: fullUser.emailVerifiedAt
      });
    }

    return res.redirect("/login?verified=success");
  } catch (error) {
    console.error("Verification failed", error);
    return res.redirect("/login?verified=invalid");
  }
}
