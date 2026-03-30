import type { NextApiRequest, NextApiResponse } from "next";
import { findUserByEmail } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed." });
    }

    const { email } = req.body as {
      email?: string;
    };
    const normalizedEmail = email?.trim().toLowerCase();

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const user = await findUserByEmail(normalizedEmail);
    return res.status(200).json({
      ok: true,
      exists: Boolean(user),
      message: user
        ? "Account found."
        : "No account exists yet. KAIRO will create one automatically when you continue."
    });
  } catch (error) {
    console.error("Login precheck failed", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
}
