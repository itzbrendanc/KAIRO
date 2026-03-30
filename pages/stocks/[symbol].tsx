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
      </section>

      <section className="grid-3">
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

      <section className="two-column">
        <div className="panel chart-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Price history</div>
              <h2>{stock.symbol} chart</h2>
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
                legend: {
                  labels: { color: "#61708f" }
                }
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

        <div className="panel signal-card signal-card-main">
          <div className="eyebrow">AI thesis</div>
          <div className="signal-line">
            <span>{stock.symbol}</span>
            <span>{formatCurrency(stock.price)}</span>
            <span className={`signal-badge signal-${signal.recommendation.toLowerCase()}`}>
              {signal.recommendation}
            </span>
          </div>
          <p className="muted-copy">
            <strong>Reason:</strong> {signal.explanation}
          </p>
          <p className="muted-copy">
            <strong>Summary:</strong> {signal.stockSummary}
          </p>
          <div className="signal-metrics">
            <span>RSI {signal.rsi}</span>
            <span>MA(5) {signal.maShort}</span>
            <span>MA(14) {signal.maLong}</span>
            <span>{signal.sentiment} sentiment</span>
          </div>
        </div>
      </section>

      <section className="grid-3">
        <div className="panel market-overview-card">
          <div className="eyebrow">Bollinger Bands</div>
          <strong>{latestBand.upper ? `${formatCurrency(latestBand.upper)} / ${formatCurrency(latestBand.lower ?? 0)}` : "Building..."}</strong>
          <span>Upper and lower volatility bands around the recent average.</span>
        </div>
        <div className="panel market-overview-card">
          <div className="eyebrow">RSI</div>
          <strong>{latestRsi ?? "N/A"}</strong>
          <span>Momentum oscillator used to spot overbought and oversold conditions.</span>
        </div>
        <div className="panel market-overview-card">
          <div className="eyebrow">MACD</div>
          <strong>{latestMacd ?? "N/A"}</strong>
          <span>Trend-following momentum signal. MACD signal line: {latestMacdSignal ?? "N/A"}.</span>
        </div>
        <div className="panel market-overview-card">
          <div className="eyebrow">Trendline</div>
          <strong>{formatCurrency(latestTrendline)}</strong>
          <span>Regression trendline showing the dominant slope across the recent period.</span>
        </div>
      </section>

      <section className="two-column">
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
                legend: {
                  labels: { color: "#61708f" }
                }
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

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Indicator guide</div>
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

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Stock summary</div>
              <h2>Investor description</h2>
            </div>
          </div>
          <p className="muted-copy">{signal.detailedDescription}</p>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Earnings snapshot</div>
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
                Estimate: {signal.earnings.estimateEps ?? "N/A"} · Actual: {signal.earnings.actualEps ?? "N/A"}
              </p>
            </div>
            <div className="lesson-card">
              <strong>Revenue</strong>
              <p className="muted-copy">
                Estimate: {signal.earnings.estimateRevenue ?? "N/A"} · Actual: {signal.earnings.actualRevenue ?? "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">News and insight</div>
            <h2>Latest coverage</h2>
          </div>
        </div>
        <div className="news-list">
          {news.filter((item) => item.isLive).map((item) => (
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
          ))}
        </div>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  if (!session?.user) {
    return {
      redirect: {
        destination: "/login",
        permanent: false
      }
    };
  }

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
