import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { sendVerificationEmail } from "@/lib/email";
import {
  createEmailUser,
  createVerificationToken,
  findUserByEmail,
  upsertAudienceMember
} from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed." });
    }

    const { email, password, marketingOptIn, productUpdatesOptIn } = req.body as {
      email?: string;
      password?: string;
      marketingOptIn?: boolean;
      productUpdatesOptIn?: boolean;
    };

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "That email is already registered." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createEmailUser({
      email,
      passwordHash,
      marketingOptIn: Boolean(marketingOptIn),
      productUpdatesOptIn: Boolean(productUpdatesOptIn)
    });

    const token = await createVerificationToken(user.email);
    const verification = await sendVerificationEmail(user.email, token.token, req);

    await upsertAudienceMember({
      email: user.email,
      userId: user.id,
      marketingOptIn: user.marketingOptIn,
      productUpdatesOptIn: user.productUpdatesOptIn,
      source: "email-signup",
      verifiedAt: null
    });

    return res.status(200).json({
      ok: true,
      message: verification.sent
        ? "Verification email sent. Open the link in your inbox to activate your account."
        : `Email delivery is unavailable right now. Use this verification link instead: ${verification.verifyUrl}`
    });
  } catch (error) {
    console.error("Signup failed", error);
    return res.status(500).json({
      error: error instanceof Error ? `Signup failed: ${error.message}` : "Signup failed."
    });
  }
}
