import type { NewsItem, SignalResult, StockQuote } from "@/lib/market-data";

async function getJson<T>(input: string): Promise<T> {
  const response = await fetch(input);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export function getStocks() {
  return getJson<{ stocks: StockQuote[] }>("/api/stocks");
}

export function getStock(symbol: string) {
  return getJson<{ stock: StockQuote }>(`/api/stocks?symbol=${encodeURIComponent(symbol)}`);
}

export function getSignals() {
  return getJson<{ signals: SignalResult[] }>("/api/signals");
}

export function getNews(symbol: string) {
  return getJson<{ news: NewsItem[] }>(`/api/news?symbol=${encodeURIComponent(symbol)}`);
}

export function getDashboard(symbol = "AAPL") {
  return getJson<{
    quote: StockQuote;
    index: { index: string; value: number; dayChange: number };
    signal: SignalResult;
    news: NewsItem[];
  }>(`/api/dashboard?symbol=${encodeURIComponent(symbol)}`);
}

export function getWatchlist() {
  return getJson<{ items: Array<{ id: number; symbol: string; company: string }> }>("/api/watchlist");
}

export async function addToWatchlist(symbol: string) {
  const response = await fetch("/api/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol })
  });
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error ?? "Unable to save watchlist item.");
  }
  return response.json() as Promise<{ items: Array<{ id: number; symbol: string; company: string }> }>;
}

export async function removeFromWatchlist(symbol: string) {
  const response = await fetch("/api/watchlist", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ symbol })
  });
  if (!response.ok) {
    const payload = await response.json();
    throw new Error(payload.error ?? "Unable to remove watchlist item.");
  }
  return response.json() as Promise<{ items: Array<{ id: number; symbol: string; company: string }> }>;
}
