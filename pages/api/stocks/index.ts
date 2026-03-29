import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { fetchInfowayPrice, getMarketBoard } from "@/lib/market-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol.toUpperCase() : null;

  if (symbol) {
    const stock = await fetchInfowayPrice(symbol);
    return res.status(200).json({ stock, fetchedAt: stock.fetchedAt });
  }

  const stocks = await getMarketBoard();
  return res.status(200).json({
    stocks,
    fetchedAt: new Date().toISOString(),
    count: stocks.length
  });
}
