export type Ticker = {
  symbol: string;
  company: string;
  sector: string;
};

export const STOCKS: Ticker[] = [
  { symbol: "AAPL", company: "Apple", sector: "Technology" },
  { symbol: "MSFT", company: "Microsoft", sector: "Technology" },
  { symbol: "NVDA", company: "NVIDIA", sector: "Technology" },
  { symbol: "AMZN", company: "Amazon", sector: "Consumer" },
  { symbol: "META", company: "Meta", sector: "Communication" },
  { symbol: "GOOGL", company: "Alphabet", sector: "Communication" },
  { symbol: "TSLA", company: "Tesla", sector: "Consumer" },
  { symbol: "JPM", company: "JPMorgan Chase", sector: "Financials" },
  { symbol: "BRK.B", company: "Berkshire Hathaway", sector: "Financials" },
  { symbol: "LLY", company: "Eli Lilly", sector: "Healthcare" },
  { symbol: "AVGO", company: "Broadcom", sector: "Technology" },
  { symbol: "XOM", company: "Exxon Mobil", sector: "Energy" },
  { symbol: "UNH", company: "UnitedHealth Group", sector: "Healthcare" },
  { symbol: "V", company: "Visa", sector: "Financials" },
  { symbol: "COST", company: "Costco", sector: "Consumer" },
  { symbol: "PG", company: "Procter & Gamble", sector: "Consumer" },
  { symbol: "JNJ", company: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "HD", company: "Home Depot", sector: "Consumer" },
  { symbol: "MA", company: "Mastercard", sector: "Financials" }
];
