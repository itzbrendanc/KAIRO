import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { updateUserEmailPreferences, upsertAudienceMember } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { marketingOptIn, productUpdatesOptIn } = req.body as {
    marketingOptIn?: boolean;
    productUpdatesOptIn?: boolean;
  };

  const user = await updateUserEmailPreferences(session.user.id, {
    marketingOptIn: Boolean(marketingOptIn),
    productUpdatesOptIn: Boolean(productUpdatesOptIn)
  });

  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  await upsertAudienceMember({
    email: user.email,
    userId: user.id,
    marketingOptIn: user.marketingOptIn,
    productUpdatesOptIn: user.productUpdatesOptIn,
    source: "preferences",
    verifiedAt: user.emailVerifiedAt
  });

  return res.status(200).json({ ok: true, user });
}
