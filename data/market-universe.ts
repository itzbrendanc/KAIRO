export type MarketInstrument = {
  symbol: string;
  company: string;
  sector: string;
  market: "equities" | "crypto" | "forex" | "indices";
};

export const MARKET_UNIVERSE: MarketInstrument[] = [
  { symbol: "SPY", company: "SPDR S&P 500 ETF", sector: "US Benchmarks", market: "indices" },
  { symbol: "QQQ", company: "Invesco QQQ Trust", sector: "US Benchmarks", market: "indices" },
  { symbol: "DIA", company: "SPDR Dow Jones Industrial Average ETF", sector: "US Benchmarks", market: "indices" },
  { symbol: "IWM", company: "iShares Russell 2000 ETF", sector: "US Benchmarks", market: "indices" },
  { symbol: "AAPL", company: "Apple", sector: "Technology", market: "equities" },
  { symbol: "MSFT", company: "Microsoft", sector: "Technology", market: "equities" },
  { symbol: "NVDA", company: "NVIDIA", sector: "Technology", market: "equities" },
  { symbol: "AMD", company: "Advanced Micro Devices", sector: "Technology", market: "equities" },
  { symbol: "AMZN", company: "Amazon", sector: "Consumer", market: "equities" },
  { symbol: "META", company: "Meta", sector: "Communication", market: "equities" },
  { symbol: "GOOGL", company: "Alphabet", sector: "Communication", market: "equities" },
  { symbol: "TSLA", company: "Tesla", sector: "Consumer", market: "equities" },
  { symbol: "JPM", company: "JPMorgan Chase", sector: "Financials", market: "equities" },
  { symbol: "BAC", company: "Bank of America", sector: "Financials", market: "equities" },
  { symbol: "LLY", company: "Eli Lilly", sector: "Healthcare", market: "equities" },
  { symbol: "XOM", company: "Exxon Mobil", sector: "Energy", market: "equities" },
  { symbol: "BTC-USD", company: "Bitcoin", sector: "Crypto Majors", market: "crypto" },
  { symbol: "ETH-USD", company: "Ethereum", sector: "Crypto Majors", market: "crypto" },
  { symbol: "SOL-USD", company: "Solana", sector: "Crypto Majors", market: "crypto" },
  { symbol: "EURUSD", company: "Euro / US Dollar", sector: "G10 FX", market: "forex" },
  { symbol: "GBPUSD", company: "British Pound / US Dollar", sector: "G10 FX", market: "forex" },
  { symbol: "USDJPY", company: "US Dollar / Japanese Yen", sector: "G10 FX", market: "forex" }
];

export const MARKET_LABELS: Record<MarketInstrument["market"], string> = {
  equities: "Equities",
  crypto: "Crypto",
  forex: "Currencies",
  indices: "Benchmarks"
};
