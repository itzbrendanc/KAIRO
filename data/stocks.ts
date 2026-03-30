export type Ticker = {
  symbol: string;
  company: string;
  sector: string;
};

export const STOCKS: Ticker[] = [
  { symbol: "SPY", company: "SPDR S&P 500 ETF", sector: "Index ETFs" },
  { symbol: "QQQ", company: "Invesco QQQ Trust", sector: "Index ETFs" },
  { symbol: "IWM", company: "iShares Russell 2000 ETF", sector: "Index ETFs" },
  { symbol: "DIA", company: "SPDR Dow Jones Industrial Average ETF", sector: "Index ETFs" },
  { symbol: "AAPL", company: "Apple", sector: "Technology" },
  { symbol: "MSFT", company: "Microsoft", sector: "Technology" },
  { symbol: "NVDA", company: "NVIDIA", sector: "Technology" },
  { symbol: "AMD", company: "Advanced Micro Devices", sector: "Technology" },
  { symbol: "TSM", company: "Taiwan Semiconductor", sector: "Technology" },
  { symbol: "AMZN", company: "Amazon", sector: "Consumer" },
  { symbol: "META", company: "Meta", sector: "Communication" },
  { symbol: "GOOGL", company: "Alphabet", sector: "Communication" },
  { symbol: "NFLX", company: "Netflix", sector: "Communication" },
  { symbol: "TSLA", company: "Tesla", sector: "Consumer" },
  { symbol: "JPM", company: "JPMorgan Chase", sector: "Financials" },
  { symbol: "BRK.B", company: "Berkshire Hathaway", sector: "Financials" },
  { symbol: "BAC", company: "Bank of America", sector: "Financials" },
  { symbol: "GS", company: "Goldman Sachs", sector: "Financials" },
  { symbol: "LLY", company: "Eli Lilly", sector: "Healthcare" },
  { symbol: "AVGO", company: "Broadcom", sector: "Technology" },
  { symbol: "XOM", company: "Exxon Mobil", sector: "Energy" },
  { symbol: "CVX", company: "Chevron", sector: "Energy" },
  { symbol: "UNH", company: "UnitedHealth Group", sector: "Healthcare" },
  { symbol: "V", company: "Visa", sector: "Financials" },
  { symbol: "COST", company: "Costco", sector: "Consumer" },
  { symbol: "WMT", company: "Walmart", sector: "Consumer" },
  { symbol: "PG", company: "Procter & Gamble", sector: "Consumer" },
  { symbol: "KO", company: "Coca-Cola", sector: "Consumer" },
  { symbol: "PEP", company: "PepsiCo", sector: "Consumer" },
  { symbol: "JNJ", company: "Johnson & Johnson", sector: "Healthcare" },
  { symbol: "HD", company: "Home Depot", sector: "Consumer" },
  { symbol: "MA", company: "Mastercard", sector: "Financials" }
];
