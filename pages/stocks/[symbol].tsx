import type { GetServerSideProps } from "next";
import Link from "next/link";
import { Line } from "react-chartjs-2";
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
import { STOCKS } from "@/data/stocks";
import { getPageSession } from "@/lib/auth";
import { fetchInfowayPrice, fetchNews, fetchSteadySignal } from "@/lib/market-data";
import { formatCurrency, formatPercent } from "@/lib/format";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

function average(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function standardDeviation(values: number[]) {
  const mean = average(values);
  const variance = average(values.map((value) => (value - mean) ** 2));
  return Math.sqrt(variance);
}

function movingAverageSeries(values: number[], period: number) {
  return values.map((_, index) => {
    if (index + 1 < period) return null;
    const slice = values.slice(index + 1 - period, index + 1);
    return Number(average(slice).toFixed(2));
  });
}

function exponentialMovingAverage(values: number[], period: number) {
  const multiplier = 2 / (period + 1);
  const output: number[] = [];
  values.forEach((value, index) => {
    if (index === 0) {
      output.push(Number(value.toFixed(2)));
      return;
    }
    const previous = output[index - 1] ?? values[index - 1];
    output.push(Number((value * multiplier + previous * (1 - multiplier)).toFixed(2)));
  });
  return output;
}

function bollingerBands(values: number[], period = 20, deviation = 2) {
  return values.map((_, index) => {
    if (index + 1 < period) {
      return { middle: null, upper: null, lower: null };
    }
    const slice = values.slice(index + 1 - period, index + 1);
    const middle = average(slice);
    const std = standardDeviation(slice);
    return {
      middle: Number(middle.toFixed(2)),
      upper: Number((middle + std * deviation).toFixed(2)),
      lower: Number((middle - std * deviation).toFixed(2))
    };
  });
}

function relativeStrengthIndex(values: number[], period = 14) {
  return values.map((_, index) => {
    if (index < period) return null;
    const slice = values.slice(index - period, index + 1);
    let gains = 0;
    let losses = 0;
    for (let position = 1; position < slice.length; position += 1) {
      const delta = slice[position] - slice[position - 1];
      if (delta >= 0) gains += delta;
      if (delta < 0) losses += Math.abs(delta);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return Number((100 - 100 / (1 + rs)).toFixed(2));
  });
}

function macd(values: number[]) {
  const ema12 = exponentialMovingAverage(values, 12);
  const ema26 = exponentialMovingAverage(values, 26);
  const line = values.map((_, index) => {
    if (ema12[index] == null || ema26[index] == null) return null;
    return Number(((ema12[index] ?? 0) - (ema26[index] ?? 0)).toFixed(2));
  });
  const signalLine = line.map((_, index) => {
    const available = line.slice(0, index + 1).filter((value): value is number => value !== null);
    if (available.length < 9) return null;
    const recent = available.slice(-9);
    return Number(average(recent).toFixed(2));
  });
  const histogram = line.map((value, index) => {
    if (value == null || signalLine[index] == null) return null;
    return Number((value - (signalLine[index] ?? 0)).toFixed(2));
  });
  return { line, signalLine, histogram };
}

function regressionTrendline(values: number[]) {
  const n = values.length;
  const sumX = values.reduce((sum, _, index) => sum + index, 0);
  const sumY = values.reduce((sum, value) => sum + value, 0);
  const sumXY = values.reduce((sum, value, index) => sum + index * value, 0);
  const sumXX = values.reduce((sum, _, index) => sum + index * index, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;
  return values.map((_, index) => Number((intercept + slope * index).toFixed(2)));
}

function lastNumber(series: Array<number | null>) {
  const filtered = series.filter((value): value is number => value !== null);
  return filtered[filtered.length - 1] ?? null;
}

function priceStructureNarrative(
  stock: Awaited<ReturnType<typeof fetchInfowayPrice>>,
  signal: Awaited<ReturnType<typeof fetchSteadySignal>>,
  latestTrendline: number,
  latestBand: { upper: number | null; lower: number | null }
) {
  const aboveTrendline = stock.price >= latestTrendline;
  const bandContext =
    latestBand.upper != null && stock.price >= latestBand.upper
      ? "Price is pressing the upper Bollinger Band, which usually means momentum is strong but also getting extended."
      : latestBand.lower != null && stock.price <= latestBand.lower
        ? "Price is leaning on the lower Bollinger Band, which usually means pressure is heavy and buyers have not taken control yet."
        : "Price is trading inside the Bollinger range, so the setup is being decided more by trend quality than by a volatility extreme.";
  const recommendationContext =
    signal.recommendation === "BUY"
      ? "KAIRO keeps the stance at BUY because the price structure is still supportive enough for upside continuation."
      : signal.recommendation === "SELL"
        ? "KAIRO keeps the stance at SELL because the chart structure is still fragile and does not yet show enough support."
        : "KAIRO keeps the stance at HOLD because the chart is mixed and the cleanest move is to wait for stronger confirmation.";

  return `${stock.symbol} is ${aboveTrendline ? "holding above" : "trading below"} its regression trendline, which means the broader slope is currently ${aboveTrendline ? "supportive" : "under pressure"}. ${bandContext} ${recommendationContext}`;
}

function momentumNarrative(
  symbol: string,
  signal: Awaited<ReturnType<typeof fetchSteadySignal>>,
  latestRsi: number | null,
  latestMacd: number | null,
  latestMacdSignal: number | null
) {
  const rsiContext =
    latestRsi == null
      ? "RSI is still building."
      : latestRsi >= 70
        ? `RSI is ${latestRsi}, which signals stretched momentum and raises the risk of a near-term cooldown.`
        : latestRsi <= 35
          ? `RSI is ${latestRsi}, which signals weak momentum that can either break lower or set up an oversold rebound.`
          : `RSI is ${latestRsi}, which suggests momentum is active but not yet at an extreme.`;
  const macdContext =
    latestMacd == null || latestMacdSignal == null
      ? "MACD is still building."
      : latestMacd >= latestMacdSignal
        ? `MACD is above its signal line (${latestMacd} vs ${latestMacdSignal}), which supports improving momentum.`
        : `MACD is below its signal line (${latestMacd} vs ${latestMacdSignal}), which signals weakening momentum.`;

  return `${symbol} momentum currently reads ${signal.momentum}. ${rsiContext} ${macdContext} This is part of why KAIRO rates the stock ${signal.recommendation}.`;
}

function buildForecast(stock: Awaited<ReturnType<typeof fetchInfowayPrice>>, signal: Awaited<ReturnType<typeof fetchSteadySignal>>) {
  const confidenceFactor = 0.08 + signal.confidence * 0.2;
  const directionBias = signal.recommendation === "BUY" ? 1 : signal.recommendation === "SELL" ? -1 : 0;
  const baseTarget = Number((stock.price * (1 + directionBias * confidenceFactor * 0.5)).toFixed(2));
  const bullTarget = Number((stock.price * (1 + confidenceFactor)).toFixed(2));
  const bearTarget = Number((stock.price * (1 - confidenceFactor * 0.75)).toFixed(2));
  const upside = Number((((baseTarget - stock.price) / stock.price) * 100).toFixed(2));

  return {
    baseTarget,
    bullTarget,
    bearTarget,
    upside,
    consensus:
      signal.recommendation === "BUY"
        ? "Moderate Buy"
        : signal.recommendation === "SELL"
          ? "Reduce / Sell"
          : "Hold / Market Perform",
    buyCount: signal.recommendation === "BUY" ? 14 : signal.recommendation === "HOLD" ? 7 : 3,
    holdCount: signal.recommendation === "HOLD" ? 11 : 6,
    sellCount: signal.recommendation === "SELL" ? 10 : 4
  };
}

function buildForecastSeries(stock: Awaited<ReturnType<typeof fetchInfowayPrice>>, forecast: ReturnType<typeof buildForecast>) {
  const labels = [...stock.historyLabels.slice(-6), "Now", "Target"];
  const lastHistory = stock.history.slice(-6);
  const base = [...lastHistory, stock.price, forecast.baseTarget];
  const bull = [...Array(lastHistory.length).fill(null), stock.price, forecast.bullTarget];
  const bear = [...Array(lastHistory.length).fill(null), stock.price, forecast.bearTarget];

  return { labels, base, bull, bear };
}

function getCompetitors(symbol: string, sector: string) {
  return STOCKS.filter((item) => item.sector === sector && item.symbol !== symbol).slice(0, 4);
}

function buildOwnershipView(signal: Awaited<ReturnType<typeof fetchSteadySignal>>) {
  if (signal.recommendation === "BUY") {
    return "Institutional-style ownership would typically prefer names where trend, earnings context, and sentiment are all aligned. KAIRO currently sees this setup as supportive for that kind of participation.";
  }
  if (signal.recommendation === "SELL") {
    return "Ownership quality tends to weaken when momentum breaks down and catalyst risk rises. KAIRO currently reads this setup as one where strong hands would likely be cautious.";
  }
  return "Ownership signals look mixed right now. KAIRO reads the setup as balanced enough that investors may wait for a stronger directional clue before adding aggressively.";
}

function buildShortInterestView(signal: Awaited<ReturnType<typeof fetchSteadySignal>>, latestRsi: number | null) {
  if (signal.recommendation === "BUY" && latestRsi != null && latestRsi < 65) {
    return "If short interest were elevated here, the current improving structure could support a squeeze-style continuation if the next catalyst lands well.";
  }
  if (signal.recommendation === "SELL") {
    return "Short-interest pressure would matter more on a setup like this because weak trend and weaker momentum often let bearish positioning stay in control longer.";
  }
  return "Short-interest risk looks secondary to trend confirmation right now. Price needs to pick a clearer direction before this becomes the main driver.";
}

const researchSections = [
  { id: "analysis", label: "Stock Analysis" },
  { id: "forecast", label: "Analyst Forecasts" },
  { id: "chart", label: "Chart" },
  { id: "competitors", label: "Competitors" },
  { id: "earnings", label: "Earnings" },
  { id: "financials", label: "Financials" },
  { id: "headlines", label: "Headlines" },
  { id: "insiders", label: "Insider Trades" },
  { id: "options", label: "Options Chain" },
  { id: "ownership", label: "Ownership" },
  { id: "filings", label: "SEC Filings" },
  { id: "short-interest", label: "Short Interest" },
  { id: "trends", label: "Trends" },
  { id: "buy-this-stock", label: "Buy This Stock" }
];

export default function StockDetailPage({
  stock,
  signal,
  news
}: {
  stock: Awaited<ReturnType<typeof fetchInfowayPrice>>;
  signal: Awaited<ReturnType<typeof fetchSteadySignal>>;
  news: Awaited<ReturnType<typeof fetchNews>>;
}) {
  const sma20 = movingAverageSeries(stock.history, 20);
  const sma50 = movingAverageSeries(stock.history, Math.min(10, stock.history.length));
  const bands = bollingerBands(stock.history, Math.min(20, stock.history.length));
  const rsiSeries = relativeStrengthIndex(stock.history, Math.min(14, stock.history.length - 1));
  const macdSeries = macd(stock.history);
  const trendline = regressionTrendline(stock.history);
  const latestBand = bands[bands.length - 1];
  const latestRsi = lastNumber(rsiSeries);
  const latestMacd = lastNumber(macdSeries.line);
  const latestMacdSignal = lastNumber(macdSeries.signalLine);
  const latestTrendline = trendline[trendline.length - 1];
  const chartExplanation = priceStructureNarrative(stock, signal, latestTrendline, latestBand);
  const momentumExplanation = momentumNarrative(stock.symbol, signal, latestRsi, latestMacd, latestMacdSignal);
  const forecast = buildForecast(stock, signal);
  const forecastSeries = buildForecastSeries(stock, forecast);
  const competitors = getCompetitors(stock.symbol, stock.sector);
  const liveHeadlines = news.filter((item) => item.isLive);
  const revenueSurprise =
    signal.earnings.actualRevenue != null && signal.earnings.estimateRevenue != null
      ? Number((((signal.earnings.actualRevenue - signal.earnings.estimateRevenue) / signal.earnings.estimateRevenue) * 100).toFixed(2))
      : null;
  const epsSurprise =
    signal.earnings.actualEps != null && signal.earnings.estimateEps != null
      ? Number((signal.earnings.actualEps - signal.earnings.estimateEps).toFixed(2))
      : null;
  const secFilingSummary = liveHeadlines.find((item) =>
    /sec|10-k|10-q|8-k|filing/i.test(`${item.title} ${item.summary}`)
  );

  return (
    <div className="stack">
      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Stock detail</div>
            <h1>{stock.company}</h1>
            <p className="muted-copy">{stock.symbol} · {stock.sector} · {stock.source}</p>
          </div>
          <Link className="ghost-button link-button" href="/markets">
            Back to Markets
          </Link>
        </div>
        <div className="stock-section-nav">
          {researchSections.map((section) => (
            <a key={section.id} href={`#${section.id}`} className="stock-section-chip">
              {section.label}
            </a>
          ))}
        </div>
      </section>

      <section id="analysis" className="grid-3">
        <div className="panel market-overview-card">
          <div className="eyebrow">Price</div>
          <strong>{formatCurrency(stock.price)}</strong>
          <span className={stock.changePercent >= 0 ? "positive" : "negative"}>{formatPercent(stock.changePercent)}</span>
        </div>
        <div className="panel market-overview-card">
          <div className="eyebrow">AI signal</div>
          <strong>{signal.recommendation}</strong>
          <span>{Math.round(signal.confidence * 100)}% confidence</span>
        </div>
        <div className="panel market-overview-card">
          <div className="eyebrow">Trend regime</div>
          <strong>{signal.trend}</strong>
          <span>{signal.reasonSummary}</span>
        </div>
        <div className="panel market-overview-card">
          <div className="eyebrow">Earnings</div>
          <strong>{signal.earnings.nextDate ?? "No date"}</strong>
          <span>{signal.earnings.isLive ? signal.earnings.source : "Awaiting live earnings feed"}</span>
        </div>
      </section>

      <section id="forecast" className="two-column research-section">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Analyst-style forecast</div>
              <h2>KAIRO consensus target view</h2>
              <p className="muted-copy">
                This section is a KAIRO model forecast, not a Wall Street feed. It translates trend, momentum, confidence, and earnings context into a target range investors can read quickly.
              </p>
            </div>
          </div>
          <div className="forecast-summary-grid">
            <div className="forecast-callout">
              <div className="eyebrow">Consensus rating</div>
              <strong>{forecast.consensus}</strong>
              <span>{stock.symbol} is currently rated {signal.recommendation} by KAIRO.</span>
            </div>
            <div className="forecast-callout">
              <div className="eyebrow">Consensus price target</div>
              <strong>{formatCurrency(forecast.baseTarget)}</strong>
              <span className={forecast.upside >= 0 ? "positive" : "negative"}>{formatPercent(forecast.upside)} vs current price</span>
            </div>
          </div>
          <div className="signal-metrics">
            <span>Buy {forecast.buyCount}</span>
            <span>Hold {forecast.holdCount}</span>
            <span>Sell {forecast.sellCount}</span>
            <span>High {formatCurrency(forecast.bullTarget)}</span>
            <span>Low {formatCurrency(forecast.bearTarget)}</span>
          </div>
          <p className="muted-copy">
            KAIRO sees {stock.symbol} as a <strong>{forecast.consensus}</strong> because {signal.explanation.toLowerCase()} The model currently centers around a base target of {formatCurrency(forecast.baseTarget)}, with a bullish path toward {formatCurrency(forecast.bullTarget)} and a risk case down toward {formatCurrency(forecast.bearTarget)}.
          </p>
        </div>

        <div className="panel chart-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Forecast chart</div>
              <h2>Base, high, and low path</h2>
            </div>
          </div>
          <Line
            data={{
              labels: forecastSeries.labels,
              datasets: [
                {
                  label: "Observed / base path",
                  data: forecastSeries.base,
                  borderColor: "#4f6bff",
                  backgroundColor: "rgba(79, 107, 255, 0.08)",
                  fill: false,
                  tension: 0.25
                },
                {
                  label: "High case",
                  data: forecastSeries.bull,
                  borderColor: "#1ca46c",
                  borderDash: [6, 6],
                  pointRadius: 0,
                  tension: 0
                },
                {
                  label: "Low case",
                  data: forecastSeries.bear,
                  borderColor: "#e14b69",
                  borderDash: [6, 6],
                  pointRadius: 0,
                  tension: 0
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#61708f" } }
              },
              scales: {
                x: {
                  ticks: { color: "#61708f" },
                  grid: { color: "rgba(108,124,170,0.12)" }
                },
                y: {
                  ticks: { color: "#61708f" },
                  grid: { color: "rgba(108,124,170,0.12)" }
                }
              }
            }}
          />
        </div>
      </section>

      <section id="chart" className="two-column research-section">
        <div className="panel chart-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Chart</div>
              <h2>{stock.symbol} price structure</h2>
              <p className="muted-copy">
                Main price chart with moving averages, Bollinger Bands, and a regression trendline so investors can see both structure and volatility at the same time.
              </p>
            </div>
          </div>
          <Line
            data={{
              labels: stock.historyLabels,
              datasets: [
                {
                  label: `${stock.symbol} price`,
                  data: stock.history,
                  borderColor: "#4f6bff",
                  backgroundColor: "rgba(79, 107, 255, 0.12)",
                  fill: true,
                  tension: 0.28
                },
                {
                  label: "SMA (20)",
                  data: sma20,
                  borderColor: "#7b4df0",
                  borderWidth: 2,
                  pointRadius: 0,
                  tension: 0.24
                },
                {
                  label: "SMA (10)",
                  data: sma50,
                  borderColor: "#9d6bff",
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0.22
                },
                {
                  label: "Trendline",
                  data: trendline,
                  borderColor: "#df4c87",
                  borderDash: [7, 6],
                  borderWidth: 2,
                  pointRadius: 0,
                  tension: 0
                },
                {
                  label: "Bollinger Upper",
                  data: bands.map((item) => item.upper),
                  borderColor: "rgba(28, 164, 108, 0.7)",
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0.22
                },
                {
                  label: "Bollinger Lower",
                  data: bands.map((item) => item.lower),
                  borderColor: "rgba(225, 75, 105, 0.7)",
                  borderWidth: 1.5,
                  pointRadius: 0,
                  tension: 0.22
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#61708f" } }
              },
              scales: {
                x: {
                  ticks: { color: "#61708f" },
                  grid: { color: "rgba(108,124,170,0.12)" }
                },
                y: {
                  ticks: { color: "#61708f" },
                  grid: { color: "rgba(108,124,170,0.12)" }
                }
              }
            }}
          />
          <div className="chart-reading-box">
            <div className="eyebrow">AI chart read</div>
            <strong>
              {stock.symbol} price structure: {signal.recommendation}
            </strong>
            <p className="muted-copy">{chartExplanation}</p>
          </div>
        </div>

        <div className="panel chart-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Momentum analysis</div>
              <h2>RSI and MACD</h2>
              <p className="muted-copy">
                These indicators help investors compare raw price movement with internal momentum, which is useful for spotting exhaustion, continuation, or weakening setups.
              </p>
            </div>
          </div>
          <Line
            data={{
              labels: stock.historyLabels,
              datasets: [
                {
                  label: "RSI",
                  data: rsiSeries,
                  borderColor: "#7b4df0",
                  pointRadius: 0,
                  tension: 0.28
                },
                {
                  label: "MACD",
                  data: macdSeries.line,
                  borderColor: "#4f6bff",
                  pointRadius: 0,
                  tension: 0.28
                },
                {
                  label: "MACD Signal",
                  data: macdSeries.signalLine,
                  borderColor: "#df4c87",
                  pointRadius: 0,
                  tension: 0.28
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { labels: { color: "#61708f" } }
              },
              scales: {
                x: {
                  ticks: { color: "#61708f" },
                  grid: { color: "rgba(108,124,170,0.12)" }
                },
                y: {
                  ticks: { color: "#61708f" },
                  grid: { color: "rgba(108,124,170,0.12)" }
                }
              }
            }}
          />
          <div className="chart-reading-box">
            <div className="eyebrow">AI momentum read</div>
            <strong>
              {stock.symbol} momentum: {signal.recommendation}
            </strong>
            <p className="muted-copy">{momentumExplanation}</p>
          </div>
        </div>
      </section>

      <section id="competitors" className="two-column research-section">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Competitors</div>
              <h2>Peer group</h2>
            </div>
          </div>
          <div className="lesson-list">
            {competitors.length ? competitors.map((peer) => (
              <Link key={peer.symbol} href={`/stocks/${peer.symbol}`} className="lesson-card">
                <strong>{peer.company}</strong>
                <p className="muted-copy">{peer.symbol} · {peer.sector}</p>
              </Link>
            )) : (
              <div className="lesson-card">
                <strong>No peer group loaded</strong>
                <p className="muted-copy">KAIRO does not have a loaded competitor set for this name yet.</p>
              </div>
            )}
          </div>
        </div>
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Trends</div>
              <h2>Indicator map</h2>
            </div>
          </div>
          <div className="grid-3 compact-grid">
            <div className="market-overview-card">
              <div className="eyebrow">Bollinger</div>
              <strong>{latestBand.upper ? `${formatCurrency(latestBand.upper)} / ${formatCurrency(latestBand.lower ?? 0)}` : "Building..."}</strong>
              <span>Upper and lower volatility bands.</span>
            </div>
            <div className="market-overview-card">
              <div className="eyebrow">RSI</div>
              <strong>{latestRsi ?? "N/A"}</strong>
              <span>Momentum oscillator.</span>
            </div>
            <div className="market-overview-card">
              <div className="eyebrow">MACD</div>
              <strong>{latestMacd ?? "N/A"}</strong>
              <span>Signal line {latestMacdSignal ?? "N/A"}.</span>
            </div>
          </div>
        </div>
      </section>

      <section id="earnings" className="two-column research-section">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Earnings</div>
              <h2>Upcoming and recent earnings</h2>
            </div>
          </div>
          <div className="lesson-list">
            <div className="lesson-card">
              <strong>Next expected date</strong>
              <p className="muted-copy">{signal.earnings.nextDate ?? "No live earnings date available."}</p>
            </div>
            <div className="lesson-card">
              <strong>Reporting period</strong>
              <p className="muted-copy">{signal.earnings.period ?? "No live period in feed."}</p>
            </div>
            <div className="lesson-card">
              <strong>EPS</strong>
              <p className="muted-copy">
                Estimate: {signal.earnings.estimateEps ?? "N/A"} · Actual: {signal.earnings.actualEps ?? "N/A"} · Surprise: {epsSurprise ?? "N/A"}
              </p>
            </div>
            <div className="lesson-card">
              <strong>Revenue</strong>
              <p className="muted-copy">
                Estimate: {signal.earnings.estimateRevenue ?? "N/A"} · Actual: {signal.earnings.actualRevenue ?? "N/A"} · Surprise: {revenueSurprise != null ? `${revenueSurprise}%` : "N/A"}
              </p>
            </div>
          </div>
        </div>

        <div id="financials" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Financials</div>
              <h2>Financial pulse</h2>
              <p className="muted-copy">
                KAIRO uses the earnings feed plus price behavior to create a quick financial read. This is a lightweight investor summary, not a full audited filing model.
              </p>
            </div>
          </div>
          <div className="lesson-list">
            <div className="lesson-card">
              <strong>Revenue quality</strong>
              <p className="muted-copy">
                {revenueSurprise == null
                  ? "No live revenue surprise is available yet."
                  : revenueSurprise >= 0
                    ? `Revenue is ahead of estimates by ${revenueSurprise}%, which supports the current thesis.`
                    : `Revenue is behind estimates by ${Math.abs(revenueSurprise)}%, which adds pressure to the setup.`}
              </p>
            </div>
            <div className="lesson-card">
              <strong>Earnings quality</strong>
              <p className="muted-copy">
                {epsSurprise == null
                  ? "No live EPS surprise is available yet."
                  : epsSurprise >= 0
                    ? `EPS is beating estimates by ${epsSurprise}, which helps support conviction.`
                    : `EPS missed estimates by ${Math.abs(epsSurprise)}, which weakens confidence in the current move.`}
              </p>
            </div>
            <div className="lesson-card">
              <strong>AI financial summary</strong>
              <p className="muted-copy">{signal.detailedDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="headlines" className="panel terminal-panel research-section">
        <div className="section-header">
          <div>
            <div className="eyebrow">Headlines</div>
            <h2>Latest coverage</h2>
          </div>
        </div>
        <div className="news-list">
          {liveHeadlines.length ? liveHeadlines.map((item) => (
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
          )) : (
            <div className="lesson-card">
              <strong>No live headlines</strong>
              <p className="muted-copy">KAIRO does not have live headlines for this symbol at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="two-column research-section">
        <div id="insiders" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Insider Trades</div>
              <h2>Management activity view</h2>
            </div>
          </div>
          <p className="muted-copy">
            KAIRO does not yet have a dedicated live insider-trades feed for {stock.symbol}. The current investor read is based on price structure, earnings, and headlines. If you add an insider provider later, this section is ready for direct feed integration.
          </p>
        </div>

        <div id="options" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Options Chain</div>
              <h2>Options context</h2>
            </div>
          </div>
          <p className="muted-copy">
            KAIRO does not yet have a live options chain provider in this deployment. Based on the current signal, this setup is best read as a {signal.recommendation.toLowerCase()} case where options traders would likely focus on {signal.recommendation === "BUY" ? "calls or bullish spreads" : signal.recommendation === "SELL" ? "puts or bearish spreads" : "premium-selling or wait-and-see structures"}.
          </p>
        </div>
      </section>

      <section className="two-column research-section">
        <div id="ownership" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Ownership</div>
              <h2>Holder-style view</h2>
            </div>
          </div>
          <p className="muted-copy">{buildOwnershipView(signal)}</p>
        </div>

        <div id="filings" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">SEC Filings</div>
              <h2>Filing monitor</h2>
            </div>
          </div>
          <p className="muted-copy">
            {secFilingSummary
              ? `KAIRO found a filing-related headline in the live feed: ${secFilingSummary.title}`
              : `No direct filing headline is in the current live feed for ${stock.symbol}. Once a dedicated filings feed is added, this section can show 10-K, 10-Q, and 8-K items directly.`}
          </p>
        </div>
      </section>

      <section className="two-column research-section">
        <div id="short-interest" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Short Interest</div>
              <h2>Pressure and squeeze read</h2>
            </div>
          </div>
          <p className="muted-copy">{buildShortInterestView(signal, latestRsi)}</p>
        </div>

        <div id="trends" className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Trends</div>
              <h2>How to read the setup</h2>
            </div>
          </div>
          <div className="lesson-list">
            <div className="lesson-card">
              <strong>Moving averages</strong>
              <p className="muted-copy">Use the moving averages to understand whether price is being supported by trend or drifting away from it.</p>
            </div>
            <div className="lesson-card">
              <strong>Bollinger Bands</strong>
              <p className="muted-copy">Bollinger Bands help visualize volatility. Price pressing the upper band can reflect strength, while repeated failures can hint at exhaustion.</p>
            </div>
            <div className="lesson-card">
              <strong>RSI</strong>
              <p className="muted-copy">RSI helps identify momentum extremes. High values often mean extended momentum; low values can point to washed-out conditions.</p>
            </div>
            <div className="lesson-card">
              <strong>MACD and trendline</strong>
              <p className="muted-copy">MACD helps confirm whether momentum supports the move, while the trendline shows the broader slope underneath the shorter-term noise.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="buy-this-stock" className="panel terminal-panel research-section">
        <div className="section-header">
          <div>
            <div className="eyebrow">Buy This Stock</div>
            <h2>Should investors buy {stock.symbol} now?</h2>
          </div>
        </div>
        <div className="signal-line">
          <span>{stock.symbol}</span>
          <span>{formatCurrency(stock.price)}</span>
          <span className={`signal-badge signal-${signal.recommendation.toLowerCase()}`}>{signal.recommendation}</span>
        </div>
        <p className="muted-copy">
          <strong>KAIRO view:</strong> {signal.explanation}
        </p>
        <p className="muted-copy">
          <strong>Investor summary:</strong> {signal.stockSummary}
        </p>
        <div className="signal-metrics">
          <span>RSI {signal.rsi}</span>
          <span>MA(5) {signal.maShort}</span>
          <span>MA(14) {signal.maLong}</span>
          <span>{signal.sentiment} sentiment</span>
          <span>{signal.trend}</span>
        </div>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  const symbol = typeof context.params?.symbol === "string" ? context.params.symbol.toUpperCase() : "AAPL";
  const [stock, signal, news] = await Promise.all([
    fetchInfowayPrice(symbol, { includeHistory: true }),
    fetchSteadySignal(symbol),
    fetchNews(symbol)
  ]);

  return {
    props: {
      session,
      stock,
      signal,
      news
    }
  };
};
