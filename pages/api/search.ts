import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { STOCKS } from "@/data/stocks";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }

  const query = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
  if (!query) {
    return res.status(200).json({ results: [] });
  }

  const results = STOCKS.filter((stock) =>
    stock.symbol.toLowerCase().includes(query) || stock.company.toLowerCase().includes(query)
  ).slice(0, 8);

  return res.status(200).json({ results });
}
