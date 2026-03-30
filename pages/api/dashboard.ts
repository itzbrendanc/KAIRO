import type { NextApiRequest, NextApiResponse } from "next";
import { getDashboardData } from "@/lib/market-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol.toUpperCase() : "AAPL";
  const data = await getDashboardData(symbol);
  return res.status(200).json(data);
}
