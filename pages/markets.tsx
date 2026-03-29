import type { GetServerSideProps } from "next";
import Link from "next/link";
import { getPageSession } from "@/lib/auth";
import { getMarketBoard } from "@/lib/market-data";
import { formatCurrency, formatPercent } from "@/lib/format";

export default function MarketsPage({
  board
}: {
  board: Awaited<ReturnType<typeof getMarketBoard>>;
}) {
  const gainers = [...board].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);
  const losers = [...board].sort((a, b) => a.changePercent - b.changePercent).slice(0, 8);
  const sectors = Object.entries(
    board.reduce<Record<string, { total: number; count: number }>>((acc, stock) => {
      const current = acc[stock.sector] ?? { total: 0, count: 0 };
      current.total += stock.changePercent;
      current.count += 1;
      acc[stock.sector] = current;
      return acc;
    }, {})
  )
    .map(([sector, values]) => ({
      sector,
      avgChange: values.total / values.count
    }))
    .sort((a, b) => b.avgChange - a.avgChange);

  return (
    <div className="stack">
      <section className="panel terminal-panel">
        <div className="eyebrow">Market hub</div>
        <h1>Market Movers</h1>
        <p className="muted-copy">
          Scan leading winners, laggards, and sector rotation from one page. Use the symbol links to jump into a deeper stock view.
        </p>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Top gainers</div>
              <h2>Strength board</h2>
            </div>
          </div>
          <div className="movers-list">
            {gainers.map((stock) => (
              <Link key={stock.symbol} className="mover-card" href={`/stocks/${encodeURIComponent(stock.symbol)}`}>
                <strong>{stock.symbol}</strong>
                <span>{stock.company}</span>
                <small>{formatCurrency(stock.price)} · <span className="positive">{formatPercent(stock.changePercent)}</span></small>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Top losers</div>
              <h2>Pressure board</h2>
            </div>
          </div>
          <div className="movers-list">
            {losers.map((stock) => (
              <Link key={stock.symbol} className="mover-card" href={`/stocks/${encodeURIComponent(stock.symbol)}`}>
                <strong>{stock.symbol}</strong>
                <span>{stock.company}</span>
                <small>{formatCurrency(stock.price)} · <span className="negative">{formatPercent(stock.changePercent)}</span></small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Sector heat</div>
              <h2>Sector leaders</h2>
            </div>
          </div>
          <div className="sector-grid">
            {sectors.map((sector) => (
              <div key={sector.sector} className="sector-card">
                <strong>{sector.sector}</strong>
                <span className={sector.avgChange >= 0 ? "positive" : "negative"}>
                  {formatPercent(sector.avgChange)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Board snapshot</div>
              <h2>Live coverage</h2>
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
            {board.slice(0, 10).map((stock) => (
              <Link key={stock.symbol} href={`/stocks/${encodeURIComponent(stock.symbol)}`} className="table-row table-action">
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

  const board = await getMarketBoard();

  return {
    props: {
      session,
      board
    }
  };
};
