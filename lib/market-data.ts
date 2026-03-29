import { STOCKS } from "@/data/stocks";

export type StockQuote = {
  symbol: string;
  company: string;
  sector: string;
  price: number;
  changePercent: number;
  history: number[];
  source: string;
  fetchedAt: string;
};

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  publishedAt: string;
};

export type SignalResult = {
  symbol: string;
  recommendation: "BUY" | "HOLD" | "SELL";
  confidence: number;
  explanation: string;
  reasonSummary: string;
  sentiment: "positive" | "neutral" | "negative";
  trend: "uptrend" | "sideways" | "downtrend";
  rsi: number;
  maShort: number;
  maLong: number;
  momentum: "strong" | "neutral" | "weak";
};

function randomFromSeed(seed: string, step: number) {
  return seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + step * 17;
}

function mockHistory(symbol: string) {
  const base = 120 + (randomFromSeed(symbol, 1) % 120);
  return Array.from({ length: 21 }, (_, index) =>
    Number((base + Math.sin(index * 0.55) * 4 + index * 0.65).toFixed(2))
  );
}

function normalizeSymbolForProvider(symbol: string) {
  return symbol.toUpperCase().replace(".", "-");
}

function buildFallbackQuote(symbol: string) {
  const company = STOCKS.find((item) => item.symbol === symbol)?.company ?? symbol;
  const sector = STOCKS.find((item) => item.symbol === symbol)?.sector ?? "Market";
  const history = mockHistory(symbol);
  const last = history[history.length - 1];
  const previous = history[history.length - 2];

  return {
    symbol,
    company,
    sector,
    price: last,
    changePercent: Number((((last - previous) / previous) * 100).toFixed(2)),
    history,
    source: "Mock Feed",
    fetchedAt: new Date().toISOString()
  } satisfies StockQuote;
}

async function fetchFinnhubQuote(symbol: string, fallback: StockQuote) {
  if (!process.env.FINNHUB_API_KEY) {
    return null;
  }

  const providerSymbol = normalizeSymbolForProvider(symbol);

  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(providerSymbol)}&token=${process.env.FINNHUB_API_KEY}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      c?: number;
      pc?: number;
      t?: number;
    };

    if (!data.c || !data.pc) {
      return null;
    }

    return {
      ...fallback,
      price: Number(data.c.toFixed(2)),
      changePercent: Number((((data.c - data.pc) / data.pc) * 100).toFixed(2)),
      source: "Finnhub",
      fetchedAt: data.t ? new Date(data.t * 1000).toISOString() : new Date().toISOString()
    } satisfies StockQuote;
  } catch {
    return null;
  }
}

async function fetchAlphaVantageQuote(symbol: string, fallback: StockQuote) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  const providerSymbol = normalizeSymbolForProvider(symbol);

  try {
    const [quoteResponse, intradayResponse] = await Promise.all([
      fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(providerSymbol)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      ),
      fetch(
        `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(providerSymbol)}&interval=5min&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      )
    ]);

    if (!quoteResponse.ok) {
      return null;
    }

    const quoteData = (await quoteResponse.json()) as {
      ["Global Quote"]?: Record<string, string>;
    };
    const globalQuote = quoteData["Global Quote"];

    if (!globalQuote?.["05. price"] || !globalQuote["09. change"]) {
      return null;
    }

    let history = fallback.history;
    let fetchedAt = new Date().toISOString();

    if (intradayResponse.ok) {
      const intradayData = (await intradayResponse.json()) as {
        ["Time Series (5min)"]?: Record<string, { ["4. close"]?: string }>;
      };
      const series = intradayData["Time Series (5min)"];

      if (series) {
        const entries = Object.entries(series)
          .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
          .slice(-21);

        if (entries.length > 3) {
          history = entries.map(([, candle]) => Number(Number(candle["4. close"] ?? fallback.price).toFixed(2)));
          fetchedAt = new Date(entries[entries.length - 1][0]).toISOString();
        }
      }
    }

    return {
      ...fallback,
      price: Number(Number(globalQuote["05. price"]).toFixed(2)),
      changePercent: Number(globalQuote["10. change percent"]?.replace("%", "") ?? fallback.changePercent),
      history,
      source: "Alpha Vantage",
      fetchedAt
    } satisfies StockQuote;
  } catch {
    return null;
  }
}

function movingAverage(values: number[], period: number) {
  const slice = values.slice(-period);
  return Number((slice.reduce((sum, value) => sum + value, 0) / slice.length).toFixed(2));
}

function calculateRSI(values: number[], period = 14) {
  const slice = values.slice(-(period + 1));
  if (slice.length < 2) {
    return 50;
  }

  let gains = 0;
  let losses = 0;

  for (let index = 1; index < slice.length; index += 1) {
    const change = slice[index] - slice[index - 1];
    if (change > 0) gains += change;
    if (change < 0) losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  const rs = gains / losses;
  return Number((100 - 100 / (1 + rs)).toFixed(2));
}

function scoreNewsSentiment(news: NewsItem[]) {
  const positiveWords = [
    "positive",
    "optimistic",
    "growth",
    "strong",
    "constructive",
    "beat",
    "upward",
    "durable"
  ];
  const negativeWords = [
    "weak",
    "negative",
    "soft",
    "caution",
    "risk",
    "down",
    "pressure",
    "fading"
  ];

  let score = 0;

  for (const item of news) {
    const text = `${item.title} ${item.summary}`.toLowerCase();
    for (const word of positiveWords) {
      if (text.includes(word)) score += 1;
    }
    for (const word of negativeWords) {
      if (text.includes(word)) score -= 1;
    }
  }

  if (score >= 2) return "positive" as const;
  if (score <= -2) return "negative" as const;
  return "neutral" as const;
}

function scoreHeadlineSentiment(text: string): NewsItem["sentiment"] {
  const normalized = text.toLowerCase();
  const positiveWords = ["beat", "growth", "surge", "bullish", "optimistic", "strong", "record", "upside"];
  const negativeWords = ["miss", "risk", "weak", "pressure", "cut", "drop", "warning", "lawsuit"];

  let score = 0;

  for (const word of positiveWords) {
    if (normalized.includes(word)) score += 1;
  }

  for (const word of negativeWords) {
    if (normalized.includes(word)) score -= 1;
  }

  if (score > 0) return "positive";
  if (score < 0) return "negative";
  return "neutral";
}

function determineTrend(price: number, maShort: number, maLong: number) {
  if (price > maShort && maShort > maLong) return "uptrend" as const;
  if (price < maShort && maShort < maLong) return "downtrend" as const;
  return "sideways" as const;
}

export async function fetchInfowayPrice(symbol: string) {
  const fallback = buildFallbackQuote(symbol);

  const finnhubQuote = await fetchFinnhubQuote(symbol, fallback);
  if (finnhubQuote) {
    return finnhubQuote;
  }

  const alphaVantageQuote = await fetchAlphaVantageQuote(symbol, fallback);
  if (alphaVantageQuote) {
    return alphaVantageQuote;
  }

  if (!process.env.INFOWAY_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch(
      `https://api.infoway.io/stocks/${encodeURIComponent(symbol)}/quote?apikey=${process.env.INFOWAY_API_KEY}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as Record<string, unknown>;

    return {
      ...fallback,
      price: Number(data.price ?? fallback.price),
      changePercent: Number(data.changePercent ?? fallback.changePercent),
      source: "Infoway",
      fetchedAt: new Date().toISOString()
    } satisfies StockQuote;
  } catch {
    return fallback;
  }
}

export async function fetchITickIndex(index: string) {
  const fallback = {
    index,
    value: 5260.84,
    dayChange: 0.48
  };

  if (!process.env.ITICK_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch(
      `https://api.itick.org/indices/${encodeURIComponent(index)}?apikey=${process.env.ITICK_API_KEY}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      return fallback;
    }

    return response.json();
  } catch {
    return fallback;
  }
}

export async function fetchSteadySignal(symbol: string) {
  const quote = await fetchInfowayPrice(symbol);
  const news = await fetchNews(symbol);
  const maShort = movingAverage(quote.history, 5);
  const maLong = movingAverage(quote.history, 14);
  const rsi = calculateRSI(quote.history, 14);
  const sentiment = scoreNewsSentiment(news);
  const trend = determineTrend(quote.price, maShort, maLong);
  const momentum =
    rsi > 68 ? "weak" :
    rsi < 35 ? "strong" :
    "neutral";

  let score = 0;
  if (trend === "uptrend") score += 2;
  if (trend === "downtrend") score -= 2;
  if (rsi < 35) score += 1;
  if (rsi > 68) score -= 1;
  if (sentiment === "positive") score += 1;
  if (sentiment === "negative") score -= 1;

  const recommendation = score >= 2 ? "BUY" : score <= -2 ? "SELL" : "HOLD";
  const confidence = Number(Math.min(0.92, 0.56 + Math.abs(score) * 0.09).toFixed(2));
  const trendText =
    trend === "uptrend" ? "price remains above both moving averages" :
    trend === "downtrend" ? "price is trading below its key moving averages" :
    "price is moving sideways around trend support";
  const momentumText =
    rsi > 68 ? "momentum looks stretched and overbought" :
    rsi < 35 ? "momentum is weak but nearing oversold territory" :
    "momentum is balanced rather than extreme";
  const sentimentText =
    sentiment === "positive" ? "news sentiment is positive" :
    sentiment === "negative" ? "news sentiment is negative" :
    "news sentiment is mixed";

  const fallback = {
    symbol,
    recommendation,
    confidence,
    reasonSummary: `${trend.replace("trend", " trend")} with ${sentiment} news sentiment`,
    explanation:
      recommendation === "BUY"
        ? `${trendText}, ${momentumText}, and ${sentimentText}. The combined setup favors a bullish entry.`
        : recommendation === "SELL"
          ? `${trendText}, ${momentumText}, and ${sentimentText}. The combined setup argues for reducing exposure.`
          : `${trendText}, ${momentumText}, and ${sentimentText}. The combined setup is mixed, so waiting is more disciplined.`,
    sentiment,
    trend,
    rsi,
    maShort,
    maLong,
    momentum
  } satisfies SignalResult;

  if (!process.env.STEADY_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch(
      `https://api.steadyapi.com/signals/${encodeURIComponent(symbol)}?apikey=${process.env.STEADY_API_KEY}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as Record<string, unknown>;
    return {
      symbol,
      recommendation: (data.recommendation as SignalResult["recommendation"]) ?? fallback.recommendation,
      confidence: Number(data.confidence ?? fallback.confidence),
      explanation: String(data.explanation ?? fallback.explanation),
      reasonSummary: String(data.reasonSummary ?? fallback.reasonSummary),
      sentiment: fallback.sentiment,
      trend: fallback.trend,
      rsi: fallback.rsi,
      maShort: fallback.maShort,
      maLong: fallback.maLong,
      momentum: fallback.momentum
    } satisfies SignalResult;
  } catch {
    return fallback;
  }
}

export async function fetchNews(symbol: string) {
  const fallback = [
    {
      title: `${symbol} attracts investor attention ahead of the next market catalyst`,
      url: "#",
      source: "KAIRO Wire",
      summary: "Sentiment is cautiously optimistic as traders look for confirmation from macro and earnings trends.",
      sentiment: "positive",
      publishedAt: new Date().toISOString()
    },
    {
      title: `Analysts debate whether ${symbol} still has room to run`,
      url: "#",
      source: "Market Journal",
      summary: "Analysts remain split between valuation caution and confidence in durable growth.",
      sentiment: "neutral",
      publishedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      title: `${symbol} options flow hints at elevated short-term expectations`,
      url: "#",
      source: "Flow Desk",
      summary: "Higher options activity suggests traders expect movement, but conviction is not one-sided.",
      sentiment: "neutral",
      publishedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString()
    }
  ] satisfies NewsItem[];

  if (process.env.FINNHUB_API_KEY) {
    try {
      const fromDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
      const toDate = new Date().toISOString().slice(0, 10);
      const response = await fetch(
        `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(normalizeSymbolForProvider(symbol))}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );

      if (response.ok) {
        const data = (await response.json()) as Array<Record<string, unknown>>;
        const items = data.slice(0, 6).map((article) => {
          const title = String(article.headline ?? `${symbol} market update`);
          const summary = String(article.summary ?? "No summary available.");
          return {
            title,
            url: String(article.url ?? "#"),
            source: "Finnhub",
            summary,
            sentiment: scoreHeadlineSentiment(`${title} ${summary}`),
            publishedAt: article.datetime
              ? new Date(Number(article.datetime) * 1000).toISOString()
              : new Date().toISOString()
          } satisfies NewsItem;
        });

        if (items.length > 0) {
          return items;
        }
      }
    } catch {
      return fallback;
    }
  }

  if (!process.env.NEWS_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(symbol)}&apiKey=${process.env.NEWS_API_KEY}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as { articles?: Array<Record<string, unknown>> };
    return (data.articles ?? []).slice(0, 6).map((article) => ({
      title: String(article.title ?? "Untitled article"),
      url: String(article.url ?? "#"),
      source: String((article.source as { name?: string } | undefined)?.name ?? "NewsAPI"),
      summary: String(article.description ?? "No summary available."),
      sentiment: scoreHeadlineSentiment(`${String(article.title ?? "")} ${String(article.description ?? "")}`),
      publishedAt: String(article.publishedAt ?? new Date().toISOString())
    })) satisfies NewsItem[];
  } catch {
    return fallback;
  }
}

export async function getDashboardData(symbol = "AAPL") {
  const [quote, index, signal, news] = await Promise.all([
    fetchInfowayPrice(symbol),
    fetchITickIndex("SP500"),
    fetchSteadySignal(symbol),
    fetchNews(symbol)
  ]);

  return {
    quote,
    index,
    signal,
    news
  };
}

export async function getMarketBoard() {
  return Promise.all(STOCKS.map((stock) => fetchInfowayPrice(stock.symbol)));
}

export async function getSignalBoard(symbols: string[]) {
  return Promise.all(symbols.map((symbol) => fetchSteadySignal(symbol)));
}
