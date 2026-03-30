import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { generateChatReply } from "@/lib/chat-assistant";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { message } = req.body as { message?: string };

  if (!message?.trim()) {
    return res.status(400).json({ error: "A message is required." });
  }

  try {
    const reply = await generateChatReply(message);
    return res.status(200).json(reply);
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to generate a response."
    });
  }
}
