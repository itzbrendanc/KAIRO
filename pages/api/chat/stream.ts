import type { NextApiRequest, NextApiResponse } from "next";
import { buildChatContext, detectSymbol } from "@/lib/chat-assistant";
import { streamOpenAIChatReply } from "@/lib/openai-chat";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed." });
  }

  const { message, messages } = req.body as { message?: string; messages?: ChatMessage[] };

  if (!message?.trim()) {
    return res.status(400).json({ error: "A message is required." });
  }

  const conversation = (messages ?? [])
    .filter((item) => item?.content?.trim() && (item.role === "user" || item.role === "assistant"))
    .slice(-10);

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured. Add it in Vercel to enable direct ChatGPT streaming."
      });
    }

    const context = await buildChatContext(message);
    const symbol = detectSymbol(message);
    res.writeHead(200, {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-KAIRO-Source": "chatgpt",
      "X-KAIRO-Symbol": symbol ?? ""
    });

    await streamOpenAIChatReply(conversation, context, (chunk) => {
      res.write(chunk);
    });

    return res.end();
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to generate a response."
    });
  }
}
