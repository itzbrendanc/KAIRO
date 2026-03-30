import type { NextApiRequest, NextApiResponse } from "next";
import { fetchSteadySignal } from "@/lib/market-data";
import { STOCKS } from "@/data/stocks";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol.toUpperCase() : null;

  if (symbol) {
    const signal = await fetchSteadySignal(symbol);
    return res.status(200).json({ signal });
  }

  const signals = await Promise.all(STOCKS.map((stock) => fetchSteadySignal(stock.symbol)));
  return res.status(200).json({ signals });
}
