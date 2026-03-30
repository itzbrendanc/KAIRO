import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { listChatThreadsForUser, saveChatThreadForUser } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ error: "Sign in to save chat history." });
  }

  if (req.method === "GET") {
    const threads = await listChatThreadsForUser(session.user.id);
    return res.status(200).json({ threads });
  }

  if (req.method === "POST") {
    const { threadId, title, messages } = req.body as {
      threadId?: number | null;
      title?: string;
      messages?: Array<{
        role: string;
        title?: string | null;
        content: string;
        source?: string | null;
      }>;
    };

    if (!title?.trim()) {
      return res.status(400).json({ error: "Thread title is required." });
    }

    if (!messages?.length) {
      return res.status(400).json({ error: "At least one chat message is required." });
    }

    const thread = await saveChatThreadForUser({
      userId: session.user.id,
      threadId: threadId ?? null,
      title,
      messages
    });

    return res.status(200).json({ thread });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
