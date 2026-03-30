import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { createGroupMessage, listMessagesForGroup, listStudyGroups } from "@/lib/community";
import { listUserWatchlist } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (req.method === "GET") {
    const premium = session?.user?.premium ?? false;
    const groupId = typeof req.query.groupId === "string" ? Number(req.query.groupId) : null;
    const groups = await listStudyGroups(premium);
    const activeGroupId = groupId && groups.some((group) => group.id === groupId) ? groupId : groups[0]?.id ?? null;
    const messages = activeGroupId ? await listMessagesForGroup(activeGroupId, premium) : [];

    return res.status(200).json({
      groups,
      activeGroupId,
      messages
    });
  }

  if (req.method === "POST") {
    if (!session?.user) {
      return res.status(401).json({ error: "Sign in to post to the community." });
    }
    const { groupId, content, symbol, shareWatchlist } = req.body as {
      groupId?: number;
      content?: string;
      symbol?: string;
      shareWatchlist?: boolean;
    };

    if (!groupId) {
      return res.status(400).json({ error: "Group is required." });
    }

    try {
      const watchlist = shareWatchlist ? await listUserWatchlist(session.user.id) : [];
      await createGroupMessage({
        groupId,
        premium: session.user.premium,
        userId: session.user.id,
        authorEmail: session.user.email,
        authorName: session.user.name ?? session.user.email.split("@")[0] ?? "Trader",
        content: content ?? "",
        symbol: symbol ?? null,
        sharedSymbols: watchlist.map((item) => item.symbol)
      });

      return res.status(200).json({
        groups: await listStudyGroups(session.user.premium),
        activeGroupId: groupId,
        messages: await listMessagesForGroup(groupId, session.user.premium)
      });
    } catch (error) {
      return res.status(400).json({
        error: error instanceof Error ? error.message : "Unable to post message."
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}
