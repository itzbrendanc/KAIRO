import { STOCKS } from "@/data/stocks";

export type StockQuote = {
  symbol: string;
  company: string;
  sector: string;
  price: number;
  changePercent: number;
  history: number[];
  historyLabels: string[];
  source: string;
  fetchedAt: string;
  isLive: boolean;
};

export type NewsItem = {
  title: string;
  url: string;
  source: string;
  summary: string;
  sentiment: "positive" | "neutral" | "negative";
  publishedAt: string;
  isLive: boolean;
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

type QuoteOptions = {
  includeHistory?: boolean;
};

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

declare global {
  var __kairoQuoteCache: Map<string, CacheEntry<StockQuote>> | undefined;
  var __kairoNewsCache: Map<string, CacheEntry<NewsItem[]>> | undefined;
  var __kairoSignalCache: Map<string, CacheEntry<SignalResult>> | undefined;
  var __kairoBoardCache: CacheEntry<StockQuote[]> | undefined;
}

const QUOTE_TTL_MS = 15_000;
const BOARD_TTL_MS = 20_000;
const NEWS_TTL_MS = 120_000;
const SIGNAL_TTL_MS = 30_000;
const ALLOW_DEMO_FALLBACK =
  process.env.NODE_ENV !== "production" || process.env.ALLOW_DEMO_MARKET_DATA === "true";

function getQuoteCache() {
  if (!globalThis.__kairoQuoteCache) {
    globalThis.__kairoQuoteCache = new Map();
  }

  return globalThis.__kairoQuoteCache;
}

function getNewsCache() {
  if (!globalThis.__kairoNewsCache) {
    globalThis.__kairoNewsCache = new Map();
  }

  return globalThis.__kairoNewsCache;
}

function getSignalCache() {
  if (!globalThis.__kairoSignalCache) {
    globalThis.__kairoSignalCache = new Map();
  }

  return globalThis.__kairoSignalCache;
}

function readCache<T>(entry: CacheEntry<T> | undefined) {
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) return null;
  return entry.value;
}

function writeCache<T>(cache: Map<string, CacheEntry<T>>, key: string, value: T, ttlMs: number) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  });
}

function randomFromSeed(seed: string, step: number) {
  return seed.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) + step * 17;
}

function mockHistory(symbol: string) {
  const base = 120 + (randomFromSeed(symbol, 1) % 120);
  return Array.from({ length: 21 }, (_, index) =>
    Number((base + Math.sin(index * 0.55) * 4 + index * 0.65).toFixed(2))
  );
}

function buildHistoryLabels(length: number) {
  return Array.from({ length }, (_, index) =>
    index === length - 1 ? "Now" : `-${length - index - 1}`
  );
}

function providerSymbolCandidates(symbol: string) {
  const normalized = symbol.toUpperCase();
  return Array.from(
    new Set([normalized, normalized.replace(".", "-"), normalized.replace("-", ".")])
  );
}

function getStockMeta(symbol: string) {
  return STOCKS.find((item) => item.symbol === symbol.toUpperCase()) ?? null;
}

function buildNewsQuery(symbol: string) {
  const stock = getStockMeta(symbol);
  const company = stock?.company ?? symbol;
  const exactTicker = `"${symbol.toUpperCase()}"`;
  const exactCompany = `"${company}"`;
  return `${exactCompany} OR ${exactTicker}`;
}

function isRelevantArticle(symbol: string, company: string, article: { title?: string; description?: string; content?: string }) {
  const haystack = `${article.title ?? ""} ${article.description ?? ""} ${article.content ?? ""}`.toLowerCase();
  const normalizedSymbol = symbol.toLowerCase();
  const companyTerms = company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((term) => term.length >= 3);

  const matchesCompany = companyTerms.some((term) => haystack.includes(term));
  const matchesTicker =
    haystack.includes(` ${normalizedSymbol} `) ||
    haystack.startsWith(`${normalizedSymbol} `) ||
    haystack.endsWith(` ${normalizedSymbol}`) ||
    haystack.includes(`(${normalizedSymbol})`);

  return matchesCompany || matchesTicker;
}

function buildFallbackQuote(symbol: string) {
  const stock = STOCKS.find((item) => item.symbol === symbol);
  const history = mockHistory(symbol);
  const last = history[history.length - 1];
  const previous = history[history.length - 2];

  return {
    symbol,
    company: stock?.company ?? symbol,
    sector: stock?.sector ?? "Market",
    price: last,
    changePercent: Number((((last - previous) / previous) * 100).toFixed(2)),
    history,
    historyLabels: buildHistoryLabels(history.length),
    source: "Demo Feed",
    fetchedAt: new Date().toISOString(),
    isLive: false
  } satisfies StockQuote;
}

function providerConfigured() {
  return Boolean(
    process.env.FINNHUB_API_KEY ||
      process.env.ALPHA_VANTAGE_API_KEY ||
      process.env.INFOWAY_API_KEY
  );
}

async function fetchFinnhubHistory(symbol: string, fallback: StockQuote) {
  if (!process.env.FINNHUB_API_KEY) {
    return {
      history: fallback.history,
      historyLabels: fallback.historyLabels,
      fetchedAt: fallback.fetchedAt
    };
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    const from = now - 60 * 60 * 24;
    for (const providerSymbol of providerSymbolCandidates(symbol)) {
      const response = await fetch(
        `https://finnhub.io/api/v1/stock/candle?symbol=${encodeURIComponent(providerSymbol)}&resolution=60&from=${from}&to=${now}&token=${process.env.FINNHUB_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        c?: number[];
        t?: number[];
        s?: string;
      };

      if (!data.c?.length || data.s !== "ok") {
        continue;
      }

      const closes = data.c.slice(-21).map((value) => Number(value.toFixed(2)));
      const timestamps = data.t?.slice(-closes.length) ?? [];
      const labels = timestamps.map((value) =>
        new Date(value * 1000).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      );

      return {
        history: closes,
        historyLabels: labels.length === closes.length ? labels : buildHistoryLabels(closes.length),
        fetchedAt: timestamps.length
          ? new Date(timestamps[timestamps.length - 1] * 1000).toISOString()
          : new Date().toISOString()
      };
    }
  } catch {
    // use fallback below
  }

  return {
    history: fallback.history,
    historyLabels: fallback.historyLabels,
    fetchedAt: fallback.fetchedAt
  };
}

async function fetchFinnhubQuote(symbol: string, fallback: StockQuote, includeHistory: boolean) {
  if (!process.env.FINNHUB_API_KEY) {
    return null;
  }

  try {
    for (const providerSymbol of providerSymbolCandidates(symbol)) {
      const response = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(providerSymbol)}&token=${process.env.FINNHUB_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );

      if (!response.ok) {
        continue;
      }

      const data = (await response.json()) as {
        c?: number;
        pc?: number;
        t?: number;
      };

      if (!data.c || !data.pc) {
        continue;
      }

      const historyData = includeHistory
        ? await fetchFinnhubHistory(symbol, fallback)
        : {
            history: fallback.history,
            historyLabels: fallback.historyLabels,
            fetchedAt: data.t ? new Date(data.t * 1000).toISOString() : new Date().toISOString()
          };

      return {
        ...fallback,
        price: Number(data.c.toFixed(2)),
        changePercent: Number((((data.c - data.pc) / data.pc) * 100).toFixed(2)),
        history: historyData.history,
        historyLabels: historyData.historyLabels,
        source: "Finnhub",
        fetchedAt: historyData.fetchedAt,
        isLive: true
      } satisfies StockQuote;
    }
  } catch {
    return null;
  }

  return null;
}

async function fetchAlphaVantageQuote(symbol: string, fallback: StockQuote, includeHistory: boolean) {
  if (!process.env.ALPHA_VANTAGE_API_KEY) {
    return null;
  }

  try {
    for (const providerSymbol of providerSymbolCandidates(symbol)) {
      const [quoteResponse, intradayResponse] = await Promise.all([
        fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(providerSymbol)}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        ),
        includeHistory
          ? fetch(
              `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${encodeURIComponent(providerSymbol)}&interval=5min&outputsize=compact&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
              { headers: { Accept: "application/json" }, cache: "no-store" }
            )
          : Promise.resolve(null)
      ]);

      if (!quoteResponse.ok) {
        continue;
      }

      const quoteData = (await quoteResponse.json()) as {
        ["Global Quote"]?: Record<string, string>;
        Note?: string;
        Information?: string;
      };
      const globalQuote = quoteData["Global Quote"];

      if (!globalQuote?.["05. price"] || !globalQuote["10. change percent"]) {
        continue;
      }

      let history = fallback.history;
      let historyLabels = fallback.historyLabels;
      let fetchedAt = new Date().toISOString();

      if (intradayResponse?.ok) {
        const intradayData = (await intradayResponse.json()) as {
          ["Time Series (5min)"]?: Record<string, { ["4. close"]?: string }>;
        };
        const series = intradayData["Time Series (5min)"];

        if (series) {
          const entries = Object.entries(series)
            .sort((left, right) => new Date(left[0]).getTime() - new Date(right[0]).getTime())
            .slice(-21);

          if (entries.length > 3) {
            history = entries.map(([, candle]) =>
              Number(Number(candle["4. close"] ?? fallback.price).toFixed(2))
            );
            historyLabels = entries.map(([timestamp]) =>
              new Date(timestamp).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
            );
            fetchedAt = new Date(entries[entries.length - 1][0]).toISOString();
          }
        }
      }

      return {
        ...fallback,
        price: Number(Number(globalQuote["05. price"]).toFixed(2)),
        changePercent: Number(globalQuote["10. change percent"].replace("%", "")),
        history,
        historyLabels,
        source: "Alpha Vantage",
        fetchedAt,
        isLive: true
      } satisfies StockQuote;
    }
  } catch {
    return null;
  }

  return null;
}

async function fetchInfowayQuote(symbol: string, fallback: StockQuote, includeHistory: boolean) {
  if (!process.env.INFOWAY_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.infoway.io/stocks/${encodeURIComponent(symbol)}/quote?apikey=${process.env.INFOWAY_API_KEY}`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const price = Number(data.price ?? NaN);
    if (!Number.isFinite(price)) {
      return null;
    }

    return {
      ...fallback,
      price: Number(price.toFixed(2)),
      changePercent: Number(Number(data.changePercent ?? fallback.changePercent).toFixed(2)),
      history: includeHistory ? fallback.history : fallback.history,
      historyLabels: fallback.historyLabels,
      source: "Infoway",
      fetchedAt: new Date().toISOString(),
      isLive: true
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
  if (slice.length < 2) return 50;

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
  const liveNews = news.filter((item) => item.isLive);
  const sourceItems = liveNews.length > 0 ? liveNews : news;
  const positiveWords = ["positive", "optimistic", "growth", "strong", "constructive", "beat", "upward", "durable"];
  const negativeWords = ["weak", "negative", "soft", "caution", "risk", "down", "pressure", "fading"];

  let score = 0;

  for (const item of sourceItems) {
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

export async function fetchInfowayPrice(symbol: string, options: QuoteOptions = {}) {
  const includeHistory = options.includeHistory ?? true;
  const cacheKey = `${symbol}:${includeHistory ? "detail" : "board"}`;
  const cached = readCache(getQuoteCache().get(cacheKey));
  if (cached) {
    return cached;
  }

  const fallback = buildFallbackQuote(symbol);

  const liveQuote =
    (await fetchFinnhubQuote(symbol, fallback, includeHistory)) ??
    (await fetchAlphaVantageQuote(symbol, fallback, includeHistory)) ??
    (await fetchInfowayQuote(symbol, fallback, includeHistory));

  const result =
    liveQuote ??
    (ALLOW_DEMO_FALLBACK || !providerConfigured()
      ? {
          ...fallback,
          source: providerConfigured() ? "Demo Feed (Provider Failed)" : "Demo Feed (Missing Live API Key)"
        }
      : fallback);

  writeCache(getQuoteCache(), cacheKey, result, QUOTE_TTL_MS);
  return result;
}

export async function fetchITickIndex(index: string) {
  const fallback = {
    index,
    value: 5260.84,
    dayChange: 0.48,
    isLive: false
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

    const data = (await response.json()) as Record<string, unknown>;
    return {
      index: String(data.index ?? index),
      value: Number(data.value ?? fallback.value),
      dayChange: Number(data.dayChange ?? fallback.dayChange),
      isLive: true
    };
  } catch {
    return fallback;
  }
}

export async function fetchNews(symbol: string) {
  const cached = readCache(getNewsCache().get(symbol));
  if (cached) {
    return cached;
  }
  const stock = getStockMeta(symbol);
  const company = stock?.company ?? symbol;

  const fallback = [
    {
      title: `${symbol} attracts investor attention ahead of the next market catalyst`,
      url: "#",
      source: "KAIRO Demo Wire",
      summary: "Live financial news is not configured yet for this deployment.",
      sentiment: "neutral",
      publishedAt: new Date().toISOString(),
      isLive: false
    }
  ] satisfies NewsItem[];

  if (process.env.FINNHUB_API_KEY) {
    try {
      const fromDate = new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString().slice(0, 10);
      const toDate = new Date().toISOString().slice(0, 10);
      for (const providerSymbol of providerSymbolCandidates(symbol)) {
        const response = await fetch(
          `https://finnhub.io/api/v1/company-news?symbol=${encodeURIComponent(providerSymbol)}&from=${fromDate}&to=${toDate}&token=${process.env.FINNHUB_API_KEY}`,
          { headers: { Accept: "application/json" }, cache: "no-store" }
        );

        if (response.ok) {
          const data = (await response.json()) as Array<Record<string, unknown>>;
          const items = data
            .filter((article) => article.headline && article.url)
            .slice(0, 6)
            .map((article) => {
              const title = String(article.headline);
              const summary = String(article.summary ?? "No summary available.");
              return {
                title,
                url: String(article.url),
                source: "Finnhub",
                summary,
                sentiment: scoreHeadlineSentiment(`${title} ${summary}`),
                publishedAt: article.datetime
                  ? new Date(Number(article.datetime) * 1000).toISOString()
                  : new Date().toISOString(),
                isLive: true
              } satisfies NewsItem;
            });

          if (items.length > 0) {
            writeCache(getNewsCache(), symbol, items, NEWS_TTL_MS);
            return items;
          }
        }
      }
    } catch {
      // continue to next provider/fallback
    }
  }

  if (process.env.NEWS_API_KEY) {
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?q=${encodeURIComponent(buildNewsQuery(symbol))}&language=en&pageSize=12&sortBy=publishedAt&searchIn=title,description&apiKey=${process.env.NEWS_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );

      if (response.ok) {
        const data = (await response.json()) as { articles?: Array<Record<string, unknown>> };
        const items = (data.articles ?? [])
          .filter(
            (article) =>
              article.title &&
              article.url &&
              isRelevantArticle(symbol, company, {
                title: String(article.title ?? ""),
                description: String(article.description ?? ""),
                content: String(article.content ?? "")
              })
          )
          .slice(0, 6)
          .map((article) => ({
            title: String(article.title),
            url: String(article.url),
            source: String((article.source as { name?: string } | undefined)?.name ?? "NewsAPI"),
            summary: String(article.description ?? "No summary available."),
            sentiment: scoreHeadlineSentiment(
              `${String(article.title ?? "")} ${String(article.description ?? "")}`
            ),
            publishedAt: String(article.publishedAt ?? new Date().toISOString()),
            isLive: true
          })) satisfies NewsItem[];

        if (items.length > 0) {
          writeCache(getNewsCache(), symbol, items, NEWS_TTL_MS);
          return items;
        }
      }
    } catch {
      // continue to fallback
    }
  }

  writeCache(getNewsCache(), symbol, fallback, NEWS_TTL_MS);
  return fallback;
}

export async function fetchSteadySignal(symbol: string) {
  const cached = readCache(getSignalCache().get(symbol));
  if (cached) {
    return cached;
  }

  const quote = await fetchInfowayPrice(symbol, { includeHistory: true });
  const news = await fetchNews(symbol);
  const maShort = movingAverage(quote.history, 5);
  const maLong = movingAverage(quote.history, 14);
  const rsi = calculateRSI(quote.history, 14);
  const sentiment = scoreNewsSentiment(news);
  const trend = determineTrend(quote.price, maShort, maLong);
  const momentum = rsi > 68 ? "weak" : rsi < 35 ? "strong" : "neutral";

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
    trend === "uptrend"
      ? "price remains above both moving averages"
      : trend === "downtrend"
        ? "price is trading below its key moving averages"
        : "price is moving sideways around trend support";
  const momentumText =
    rsi > 68
      ? "momentum looks stretched and overbought"
      : rsi < 35
        ? "momentum is weak but nearing oversold territory"
        : "momentum is balanced rather than extreme";
  const sentimentText =
    sentiment === "positive"
      ? "news sentiment is positive"
      : sentiment === "negative"
        ? "news sentiment is negative"
        : "news sentiment is mixed";

  const result = {
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

  if (process.env.STEADY_API_KEY) {
    try {
      const response = await fetch(
        `https://api.steadyapi.com/signals/${encodeURIComponent(symbol)}?apikey=${process.env.STEADY_API_KEY}`,
        { headers: { Accept: "application/json" }, cache: "no-store" }
      );

      if (response.ok) {
        const data = (await response.json()) as Record<string, unknown>;
        const liveResult = {
          ...result,
          recommendation:
            (data.recommendation as SignalResult["recommendation"] | undefined) ?? result.recommendation,
          confidence: Number(data.confidence ?? result.confidence),
          explanation: String(data.explanation ?? result.explanation),
          reasonSummary: String(data.reasonSummary ?? result.reasonSummary)
        } satisfies SignalResult;

        writeCache(getSignalCache(), symbol, liveResult, SIGNAL_TTL_MS);
        return liveResult;
      }
    } catch {
      // use computed signal
    }
  }

  writeCache(getSignalCache(), symbol, result, SIGNAL_TTL_MS);
  return result;
}

export async function getDashboardData(symbol = "AAPL") {
  const [quote, index, signal, news] = await Promise.all([
    fetchInfowayPrice(symbol, { includeHistory: true }),
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
  const cached = readCache(globalThis.__kairoBoardCache);
  if (cached) {
    return cached;
  }

  const stocks = await Promise.all(
    STOCKS.map((stock) => fetchInfowayPrice(stock.symbol, { includeHistory: false }))
  );
  const liveStocks = stocks.filter((stock) => stock.isLive);
  const board = liveStocks.length > 0 ? liveStocks : stocks;

  globalThis.__kairoBoardCache = {
    value: board,
    expiresAt: Date.now() + BOARD_TTL_MS
  };

  return board;
}

export async function getSignalBoard(symbols: string[]) {
  return Promise.all(symbols.map((symbol) => fetchSteadySignal(symbol)));
}
