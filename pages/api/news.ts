import type { NextApiRequest, NextApiResponse } from "next";
import { fetchNews } from "@/lib/market-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol.toUpperCase() : "AAPL";
  const news = await fetchNews(symbol);
  return res.status(200).json({
    symbol,
    news,
    fetchedAt: new Date().toISOString()
  });
}
