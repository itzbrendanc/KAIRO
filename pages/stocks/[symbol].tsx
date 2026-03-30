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

export default function StockDetailPage({
  stock,
  signal,
  news
}: {
  stock: Awaited<ReturnType<typeof fetchInfowayPrice>>;
  signal: Awaited<ReturnType<typeof fetchSteadySignal>>;
  news: Awaited<ReturnType<typeof fetchNews>>;
}) {
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
            </div>
          </div>
          <Line
            data={{
              labels: stock.historyLabels,
              datasets: [
                {
                  label: `${stock.symbol} price`,
                  data: stock.history,
                  borderColor: "#2de6c0",
                  backgroundColor: "rgba(45, 230, 192, 0.15)",
                  fill: true,
                  tension: 0.28
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: {
                  labels: { color: "#d9ecff" }
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
