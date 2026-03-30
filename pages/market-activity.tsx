import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getMarketBoard } from "@/lib/market-data";
import { formatCurrency, formatPercent } from "@/lib/format";
import { KairoLogo } from "@/components/branding/kairo-logo";

export default function MarketActivityPage({
  board
}: {
  board: Awaited<ReturnType<typeof getMarketBoard>>;
}) {
  const grouped = Object.entries(
    board.reduce<Record<string, typeof board>>((acc, stock) => {
      acc[stock.sector] = [...(acc[stock.sector] ?? []), stock];
      return acc;
    }, {})
  ).sort((left, right) => right[1].length - left[1].length);

  return (
    <div className="page stack public-page">
      <section className="panel public-hero">
        <KairoLogo size="sm" />
        <div className="eyebrow">Market activity</div>
        <h1>Broad market activity in one live display</h1>
        <p className="muted-copy">
          This page brings together the KAIRO market universe into one large board so users can scan index ETFs, mega-cap stocks, sector leaders, and broad risk appetite in one place.
        </p>
        <div className="hero-controls">
          <Link className="primary-button link-button" href="/signup">
            Start Using KAIRO
          </Link>
          <Link className="ghost-button link-button" href="/dashboard">
            Open Dashboard
          </Link>
        </div>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Full board</div>
            <h2>Tracked market universe</h2>
            <p className="muted-copy">
              Quotes refresh from the configured live providers and show the current feed for each instrument. This board focuses on high-interest names and broad market benchmarks.
            </p>
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
            <Link
              key={stock.symbol}
              href={`/stocks/${encodeURIComponent(stock.symbol)}`}
              className="table-row table-action"
            >
              <span>{stock.symbol}</span>
              <span>{stock.company}</span>
              <span>{formatCurrency(stock.price)}</span>
              <span className={stock.changePercent >= 0 ? "positive" : "negative"}>
                {formatPercent(stock.changePercent)}
              </span>
              <span className="mini-meta">{stock.source}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="stack">
        {grouped.map(([sector, stocks]) => (
          <div key={sector} className="panel terminal-panel">
            <div className="section-header">
              <div>
                <div className="eyebrow">{sector}</div>
                <h2>{sector} leaders</h2>
                <p className="muted-copy">
                  A focused group view for the names KAIRO tracks in this part of the market so users can compare leadership and weakness quickly.
                </p>
              </div>
            </div>
            <div className="card-grid">
              {stocks.map((stock) => (
                <Link key={stock.symbol} href={`/stocks/${encodeURIComponent(stock.symbol)}`} className="mover-card">
                  <strong>{stock.symbol}</strong>
                  <span>{stock.company}</span>
                  <small className={stock.changePercent >= 0 ? "positive" : "negative"}>
                    {formatCurrency(stock.price)} · {formatPercent(stock.changePercent)}
                  </small>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const board = await getMarketBoard();

  return {
    props: {
      board
    }
  };
};
