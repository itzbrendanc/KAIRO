import { useEffect, useMemo, useState } from "react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from "chart.js";
import { Line } from "react-chartjs-2";
import { addToWatchlist, getDashboard, getSignals, getStocks, getWatchlist, removeFromWatchlist } from "@/lib/api-client";
import { KairoLogo } from "@/components/branding/kairo-logo";
import type { NewsItem, SignalResult, StockQuote } from "@/lib/market-data";
import { formatCurrency, formatPercent } from "@/lib/format";
import { StatCard } from "@/components/ui/stat-card";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

type DashboardPayload = {
  quote: StockQuote;
  index: { index: string; value: number; dayChange: number; isLive?: boolean };
  signal: SignalResult;
  news: NewsItem[];
};

export function Dashboard({
  initialData,
  initialBoard,
  initialWatchlist,
  initialSignals,
  premium
}: {
  initialData: DashboardPayload;
  initialBoard: StockQuote[];
  initialWatchlist: Array<{ id: number; symbol: string; company: string }>;
  initialSignals: SignalResult[];
  premium: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [board, setBoard] = useState(initialBoard);
  const [loading, setLoading] = useState(false);
  const [symbol, setSymbol] = useState(initialData.quote.symbol);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const [watchSymbol, setWatchSymbol] = useState("");
  const [watchlistBusy, setWatchlistBusy] = useState(false);
  const [signalCards, setSignalCards] = useState(initialSignals);
  const [lastBoardRefresh, setLastBoardRefresh] = useState(initialBoard[0]?.fetchedAt ?? initialData.quote.fetchedAt);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const [dashboard, stocks, watchlistPayload, signalsPayload] = await Promise.all([
          getDashboard(symbol),
          getStocks(),
          getWatchlist(),
          getSignals()
        ]);
        setData(dashboard);
        setBoard(stocks.stocks);
        setWatchlist(watchlistPayload.items);
        setSignalCards(signalsPayload.signals);
        setLastBoardRefresh(stocks.stocks[0]?.fetchedAt ?? new Date().toISOString());
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Refresh failed.");
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [symbol]);

  async function refresh(nextSymbol?: string) {
    const activeSymbol = nextSymbol ?? symbol;
    setLoading(true);
    setError(null);

    try {
      const [dashboard, stocks, signalsPayload] = await Promise.all([getDashboard(activeSymbol), getStocks(), getSignals()]);
      setData(dashboard);
      setBoard(stocks.stocks);
      setSymbol(activeSymbol);
      setSignalCards(signalsPayload.signals);
      setLastBoardRefresh(stocks.stocks[0]?.fetchedAt ?? new Date().toISOString());
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }

  async function saveWatchlistSymbol() {
    if (!watchSymbol) return;
    setWatchlistBusy(true);
    setError(null);

    try {
      const payload = await addToWatchlist(watchSymbol);
      setWatchlist(payload.items);
      setWatchSymbol("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update watchlist.");
    } finally {
      setWatchlistBusy(false);
    }
  }

  async function deleteWatchlistSymbol(nextSymbol: string) {
    setWatchlistBusy(true);
    setError(null);

    try {
      const payload = await removeFromWatchlist(nextSymbol);
      setWatchlist(payload.items);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to update watchlist.");
    } finally {
      setWatchlistBusy(false);
    }
  }

  const chartData = useMemo(
    () => ({
      labels: data.quote.historyLabels,
      datasets: [
        {
          label: `${data.quote.symbol} price`,
          data: data.quote.history,
          borderColor: "#69b8ff",
          backgroundColor: "rgba(105, 184, 255, 0.18)",
          fill: true,
          tension: 0.32
        }
      ]
    }),
    [data.quote.history, data.quote.historyLabels, data.quote.symbol]
  );

  const visibleSignalCards = premium ? signalCards.slice(0, 6) : signalCards.slice(0, 2);
  const visibleHistory = premium ? data.quote.history : data.quote.history.slice(-4);
  const chartLabels = premium ? data.quote.historyLabels : data.quote.historyLabels.slice(-4);
  const primaryExplanation = premium
    ? data.signal.explanation
    : "Upgrade to KAIRO Premium to unlock the full AI explanation, historical trend readout, and expanded signal coverage.";
  const liveBoardCount = board.filter((item) => item.isLive).length;
  const liveNewsCount = data.news.filter((item) => item.isLive).length;
  const visibleNews = data.news.filter((item) => item.isLive);
  const marketOverview = useMemo(
    () => [
      {
        label: "Lead symbol",
        value: data.quote.symbol,
        helper: `${data.quote.source} · ${new Date(data.quote.fetchedAt).toLocaleTimeString()}`
      },
      {
        label: "Live board",
        value: `${liveBoardCount}/${board.length}`,
        helper: "quotes live"
      },
      {
        label: "Headline flow",
        value: `${visibleNews.length}`,
        helper: "live headlines"
      },
      {
        label: "Watchlist",
        value: `${watchlist.length}`,
        helper: "tracked names"
      }
    ],
    [board.length, data.quote.fetchedAt, data.quote.source, data.quote.symbol, liveBoardCount, visibleNews.length, watchlist.length]
  );
  const topGainers = useMemo(
    () => [...board].sort((left, right) => right.changePercent - left.changePercent).slice(0, 4),
    [board]
  );
  const topLosers = useMemo(
    () => [...board].sort((left, right) => left.changePercent - right.changePercent).slice(0, 4),
    [board]
  );
  const sectorLeaders = useMemo(() => {
    const grouped = board.reduce<Record<string, { total: number; count: number }>>((acc, stock) => {
      const current = acc[stock.sector] ?? { total: 0, count: 0 };
      current.total += stock.changePercent;
      current.count += 1;
      acc[stock.sector] = current;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([sector, values]) => ({
        sector,
        avgChange: values.total / values.count
      }))
      .sort((left, right) => right.avgChange - left.avgChange)
      .slice(0, 6);
  }, [board]);

  return (
    <div className="stack">
      <section className="hero panel terminal-panel dashboard-cinematic">
        <div>
          <KairoLogo size="sm" />
          <div className="eyebrow">AI investing workspace</div>
          <h1>KAIRO Dashboard</h1>
          <p className="hero-copy">
            Track live market moves, watch the board refresh every few seconds, read the most relevant headlines first, and get AI trading context without leaving your KAIRO workspace.
          </p>
          <div className="mini-meta">Board refreshes every 5 seconds. Latest update: {new Date(lastBoardRefresh).toLocaleTimeString()}</div>
        </div>
        <div className="hero-controls">
          <input
            className="text-input"
            value={symbol}
            onChange={(event) => setSymbol(event.target.value.toUpperCase())}
            placeholder="AAPL"
          />
          <button className="primary-button" onClick={() => refresh()}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </section>

      {error ? <div className="error-banner">{error}</div> : null}
      {!data.quote.isLive ? (
        <div className="error-banner">
          Live stock data is unavailable for this deployment right now. Add a valid `FINNHUB_API_KEY`, `ALPHA_VANTAGE_API_KEY`, or `INFOWAY_API_KEY` in Vercel to restore real market prices.
        </div>
      ) : null}
      {data.quote.isLive && liveNewsCount === 0 ? (
        <div className="success-banner">
          Live prices are active. Add `FINNHUB_API_KEY` or `NEWS_API_KEY` as well if you want live market headlines in the news feed.
        </div>
      ) : null}

      <section className="grid-3">
        <StatCard
          label={`${data.quote.symbol} Price`}
          value={formatCurrency(data.quote.price)}
          helper={`${formatPercent(data.quote.changePercent)} · ${data.quote.source}`}
        />
        <StatCard
          label="S&P 500"
          value={data.index.value.toLocaleString()}
          helper={`${formatPercent(data.index.dayChange)} · ${data.index.isLive ? "Live" : "Unavailable"}`}
        />
        <StatCard
          label="AI Signal"
          value={data.signal.recommendation}
          helper={premium ? `${Math.round(data.signal.confidence * 100)}% confidence` : "Premium unlocks full confidence"}
        />
      </section>

      <section className="market-overview-grid">
        {marketOverview.map((item) => (
          <div key={item.label} className="panel market-overview-card">
            <div className="eyebrow">{item.label}</div>
            <strong>{item.value}</strong>
            <span>{item.helper}</span>
          </div>
        ))}
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Market movers</div>
              <h2>Top gainers</h2>
              <p className="muted-copy">The strongest names on the current board, ranked by percentage move so you can spot leadership fast.</p>
            </div>
          </div>
          <div className="movers-list">
            {topGainers.map((stock) => (
              <button key={stock.symbol} className="mover-card" onClick={() => refresh(stock.symbol)}>
                <strong>{stock.symbol}</strong>
                <span>{stock.company}</span>
                <small className="positive">{formatPercent(stock.changePercent)}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Risk watch</div>
              <h2>Top losers</h2>
              <p className="muted-copy">The weakest names on the board right now, useful for spotting breakdowns, panic moves, or reversal setups.</p>
            </div>
          </div>
          <div className="movers-list">
            {topLosers.map((stock) => (
              <button key={stock.symbol} className="mover-card" onClick={() => refresh(stock.symbol)}>
                <strong>{stock.symbol}</strong>
                <span>{stock.company}</span>
                <small className="negative">{formatPercent(stock.changePercent)}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Sector pulse</div>
              <h2>Leading sectors</h2>
              <p className="muted-copy">Average performance by sector so you can see where money is rotating instead of watching single names in isolation.</p>
            </div>
          </div>
          <div className="sector-grid">
            {sectorLeaders.map((sector) => (
              <div key={sector.sector} className="sector-card">
                <strong>{sector.sector}</strong>
                <span className={sector.avgChange >= 0 ? "positive" : "negative"}>
                  {formatPercent(sector.avgChange)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel dashboard-gif-card">
          <div className="section-header">
            <div>
              <div className="eyebrow">Market motion</div>
              <h2>Live terminal atmosphere</h2>
              <p className="muted-copy">A visual product reel that shows the KAIRO workspace style while your live market modules update alongside it.</p>
            </div>
          </div>
          <div className="dashboard-gif-frame">
            <img src="/kairo-hero.gif" alt="KAIRO market motion" />
          </div>
          <p className="muted-copy">
            KAIRO now blends live data, signal boards, watchlists, movers, sectors, and richer visual context into a more complete market portal.
          </p>
        </div>
      </section>

      <section className="panel watchlist-strip">
        <div className="section-header">
            <div>
              <div className="eyebrow">Quick access</div>
              <h2>Your watchlist</h2>
              <p className="muted-copy">One-click access to the names you care about most so you can jump straight into their chart, signal, and news view.</p>
            </div>
          </div>
        <div className="watchlist-pills">
          {watchlist.map((item) => (
            <button key={item.id} className="watch-pill" onClick={() => refresh(item.symbol)}>
              <strong>{item.symbol}</strong>
              <span>{item.company}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="panel premium-strip">
        <div>
          <div className="eyebrow">{premium ? "KAIRO Premium active" : "Upgrade available"}</div>
          <h2>{premium ? "Full analysis is unlocked" : "Unlock deeper market intelligence"}</h2>
          <p className="muted-copy">
            {premium
              ? "You have access to more signals, historical trend depth, and the full AI reasoning layer across KAIRO."
              : "Premium adds more signals, full historical trend context, and complete AI analysis across your tracked names."}
          </p>
        </div>
        {!premium ? (
          <a className="primary-button link-button" href="/subscription">
            Upgrade to Premium
          </a>
        ) : null}
      </section>

      <section className="dashboard-grid">
        <div className="panel chart-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Historical chart</div>
              <h2>{data.quote.company}</h2>
              <p className="muted-copy">Recent price history for the active symbol, used by the AI layer to read trend direction, momentum, and setup quality.</p>
            </div>
            {!premium ? <span className="pill">Premium trend depth locked</span> : null}
          </div>
          {!premium ? <p className="muted-copy">Free mode shows a compact trend preview. Premium unlocks the full multi-session historical view.</p> : null}
          <Line
            data={{
              ...chartData,
              labels: chartLabels,
              datasets: [
                {
                  ...chartData.datasets[0],
                  data: visibleHistory
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  labels: {
                    color: "#d9ecff"
                  }
                }
              },
              scales: {
                x: {
                  ticks: { color: "#8ea8c7" },
                  grid: { color: "rgba(255,255,255,0.06)" }
                },
                y: {
                  ticks: { color: "#8ea8c7" },
                  grid: { color: "rgba(255,255,255,0.06)" }
                }
              }
            }}
          />
        </div>

        <div className="stack compact-stack">
          <div className="panel signal-card signal-card-main">
            <div className="eyebrow">AI trade signal</div>
            <p className="muted-copy">KAIRO combines price trend, moving averages, RSI, and current news sentiment to produce a plain-English trade stance.</p>
            <div className="signal-line">
              <span>{data.quote.symbol}</span>
              <span>{formatCurrency(data.quote.price)}</span>
              <span className={`signal-badge signal-${data.signal.recommendation.toLowerCase()}`}>
                {data.signal.recommendation}
              </span>
            </div>
            <p className="muted-copy">
              <strong>Reason:</strong> {primaryExplanation}
            </p>
            {!data.quote.isLive ? (
              <p className="muted-copy">
                This signal is currently limited by missing live quote coverage. Configure a live quote provider to make the analysis reflect the real market.
              </p>
            ) : null}
            <div className="mini-meta">
              {premium ? `Confidence: ${Math.round(data.signal.confidence * 100)}%` : "Confidence score available on Premium"}
            </div>
            <div className="signal-metrics">
              <span>{data.signal.reasonSummary}</span>
              {premium ? <span>RSI {data.signal.rsi}</span> : null}
              {premium ? <span>MA(5) {data.signal.maShort}</span> : null}
              {premium ? <span>MA(14) {data.signal.maLong}</span> : null}
            </div>
          </div>

          <div className="panel watchlist-panel">
            <div className="section-header">
              <div>
                <div className="eyebrow">Favorites</div>
                <h2>Watchlist</h2>
                <p className="muted-copy">Save favorite stocks here and pull them into the live dashboard instantly as your research list changes.</p>
              </div>
            </div>
            <div className="watchlist-form">
              <input
                className="text-input"
                value={watchSymbol}
                onChange={(event) => setWatchSymbol(event.target.value.toUpperCase())}
                placeholder="Add symbol"
              />
              <button className="primary-button" disabled={watchlistBusy} onClick={saveWatchlistSymbol}>
                {watchlistBusy ? "Saving..." : "Add"}
              </button>
            </div>
            <div className="watchlist-list">
              {watchlist.map((item) => (
                <div key={item.id} className="watchlist-item">
                  <button className="watchlist-symbol" onClick={() => refresh(item.symbol)}>
                    <strong>{item.symbol}</strong>
                    <span>{item.company}</span>
                  </button>
                  <button className="ghost-button watchlist-remove" onClick={() => deleteWatchlistSymbol(item.symbol)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Market board</div>
              <h2>S&amp;P 500 board</h2>
              <p className="muted-copy">A live market board of tracked large-cap names. Prices refresh every 5 seconds and show which feed supplied the quote.</p>
            </div>
          </div>
          <div className="table">
            <div className="table-row table-head">
              <span>Symbol</span>
              <span>Company</span>
              <span>Price</span>
              <span>Change</span>
              <span>Feed</span>
            </div>
            {board.map((stock) => (
              <button key={stock.symbol} className="table-row table-action" onClick={() => refresh(stock.symbol)}>
                <span>{stock.symbol}</span>
                <span>{stock.company}</span>
                <span>{formatCurrency(stock.price)}</span>
                <span className={stock.changePercent >= 0 ? "positive" : "negative"}>
                  {formatPercent(stock.changePercent)}
                </span>
                <span className="mini-meta">{stock.isLive ? stock.source : "Unavailable"}</span>
              </button>
            ))}
          </div>
          <div className="mini-meta">
            {liveBoardCount} of {board.length} board quotes are live. True tick-by-tick streaming would require a websocket-grade market feed.
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">News feed</div>
              <h2>Recent headlines</h2>
              <p className="muted-copy">Important live headlines for the active symbol, ranked by recency and event significance so earnings, guidance, and major catalysts rise to the top.</p>
            </div>
          </div>
          <div className="news-list">
            {visibleNews.length > 0 ? (
              visibleNews.map((item) => (
                <a key={`${item.title}-${item.source}`} href={item.url} className="news-card" target="_blank" rel="noreferrer">
                  <div className="news-headline-row">
                    <strong>{item.title}</strong>
                    <span className={`news-sentiment news-${item.sentiment}`}>{item.sentiment}</span>
                  </div>
                  <span>{item.summary}</span>
                  <small>
                    {item.source} • {new Date(item.publishedAt).toLocaleString()}
                  </small>
                </a>
              ))
            ) : (
              <div className="muted-copy">
                No live headlines are available for this symbol right now. Add `FINNHUB_API_KEY` or `NEWS_API_KEY`, or try another stock.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Signal cards</div>
              <h2>Quick trade ideas</h2>
              <p className="muted-copy">A faster signal board for additional names so you can scan setups across the market instead of reading one stock at a time.</p>
            </div>
          </div>
        <div className="card-grid signal-grid">
          {visibleSignalCards.map((signal) => {
            const stock = board.find((item) => item.symbol === signal.symbol);
            const price = stock?.price ?? data.quote.price;

            return (
              <div key={signal.symbol} className="panel signal-card signal-card-mini">
                <div className="signal-line">
                  <span>{signal.symbol}</span>
                  <span>{formatCurrency(price)}</span>
                  <span className={`signal-badge signal-${signal.recommendation.toLowerCase()}`}>{signal.recommendation}</span>
                </div>
                <p className="muted-copy">
                  <strong>Reason:</strong> {premium ? signal.explanation : "Upgrade to KAIRO Premium to read the full AI reasoning for this setup."}
                </p>
                <div className="signal-metrics">
                  <span>{signal.reasonSummary}</span>
                </div>
              </div>
            );
          })}
        </div>
        {!premium ? (
          <div className="premium-note">
            Free accounts see 2 signal previews. Upgrade to Premium to unlock the full signal board and expanded analysis.
          </div>
        ) : null}
      </section>
    </div>
  );
}
