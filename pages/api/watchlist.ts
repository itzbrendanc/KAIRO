import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { addWatchlistItem, listUserWatchlist, removeWatchlistItem } from "@/lib/repository";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  if (req.method === "GET") {
    const items = await listUserWatchlist(session.user.id);
    return res.status(200).json({ items });
  }

  if (req.method === "POST") {
    const { symbol } = req.body as { symbol?: string };
    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required." });
    }

    try {
      await addWatchlistItem(session.user.id, symbol);
      const items = await listUserWatchlist(session.user.id);
      return res.status(200).json({ items });
    } catch (error) {
      return res.status(400).json({ error: error instanceof Error ? error.message : "Unable to add symbol." });
    }
  }

  if (req.method === "DELETE") {
    const { symbol } = req.body as { symbol?: string };
    if (!symbol) {
      return res.status(400).json({ error: "Symbol is required." });
    }

    await removeWatchlistItem(session.user.id, symbol);
    const items = await listUserWatchlist(session.user.id);
    return res.status(200).json({ items });
  }

  return res.status(405).json({ error: "Method not allowed." });
}
