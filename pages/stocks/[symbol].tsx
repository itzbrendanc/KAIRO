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
          <div className="signal-metrics">
            <span>RSI {signal.rsi}</span>
            <span>MA(5) {signal.maShort}</span>
            <span>MA(14) {signal.maLong}</span>
            <span>{signal.sentiment} sentiment</span>
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
