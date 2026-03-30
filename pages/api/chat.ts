import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { buildChatContext, detectSymbol } from "@/lib/chat-assistant";
import { getUserProfile } from "@/lib/repository";
import { generateOpenAIChatReply } from "@/lib/openai-chat";

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

  try {
    const session = await getApiSession(req, res);
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured. Add it in Vercel to enable direct ChatGPT answers."
      });
    }

    const conversation = (messages ?? [])
      .filter((item) => item?.content?.trim() && (item.role === "user" || item.role === "assistant"))
      .slice(-10);
    const context = await buildChatContext(message);
    const profile = session?.user ? await getUserProfile(session.user.id) : null;
    const userMemory = profile
      ? [
          `Experience level: ${profile.experienceLevel}`,
          `Risk tolerance: ${profile.riskTolerance}`,
          `Investing goal: ${profile.investingGoal}`,
          `Time horizon: ${profile.timeHorizon}`,
          profile.favoriteSectors ? `Favorite sectors: ${profile.favoriteSectors}` : null,
          profile.favoriteSymbols ? `Favorite symbols: ${profile.favoriteSymbols}` : null,
          profile.preferredStrategies ? `Preferred strategies: ${profile.preferredStrategies}` : null,
          profile.bio ? `User notes: ${profile.bio}` : null
        ]
          .filter(Boolean)
          .join("\n")
      : undefined;
    const symbol = detectSymbol(message);
    const reply = await generateOpenAIChatReply(conversation, context, userMemory);

    return res.status(200).json({
      ...reply,
      symbol
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Unable to generate a response."
    });
  }
}
