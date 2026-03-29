import type { NextApiRequest, NextApiResponse } from "next";
import { getApiSession } from "@/lib/auth";
import { getDashboardData } from "@/lib/market-data";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getApiSession(req, res);
  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized." });
  }
  const symbol = typeof req.query.symbol === "string" ? req.query.symbol.toUpperCase() : "AAPL";
  const data = await getDashboardData(symbol);
  return res.status(200).json(data);
}
