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

    if (!email || !email.includes("@")) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const user = await findUserByEmail(email);

    if (!user) {
      return res.status(404).json({ error: "No account found for that email. Create one first." });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Login precheck failed", error);
    return res.status(500).json({ error: "Internal server error during login." });
  }
}
