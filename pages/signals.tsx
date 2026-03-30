import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { getMarketBoard, fetchSteadySignal } from "@/lib/market-data";

export default function SignalsPage({
  signals,
  premium
}: {
  signals: Awaited<ReturnType<typeof fetchSteadySignal>>[];
  premium: boolean;
}) {
  const visibleSignals = premium ? signals : signals.slice(0, 6);

  return (
    <div className="stack">
      <section className="panel">
        <div className="eyebrow">Signal center</div>
        <h1>KAIRO Signals</h1>
        <p className="muted-copy">
          {premium
            ? "You have premium access to full confidence scores and signal explanations."
            : "Free users can preview the signal feed. Premium unlocks deeper analysis, more symbols, and full AI reasoning."}
        </p>
      </section>

      <div className="card-grid">
        {visibleSignals.map((signal) => (
          <div key={signal.symbol} className="panel">
            <div className="eyebrow">{signal.symbol}</div>
            <h2>{signal.recommendation}</h2>
            <div className="mini-meta">
              {signal.reasonSummary}
            </div>
            <p className="muted-copy">
              {signal.stockSummary}
            </p>
            <p className="muted-copy">
              {premium ? signal.explanation : "Upgrade to KAIRO Premium to unlock the full explanation for this signal."}
            </p>
            <div className="mini-meta">
              {premium ? `${Math.round(signal.confidence * 100)}% confidence` : "Premium required"}
            </div>
            <div className="mini-meta">
              Earnings: {signal.earnings.nextDate ?? "No live date"} {signal.earnings.period ? `· ${signal.earnings.period}` : ""}
            </div>
            {premium ? (
              <div className="signal-metrics">
                <span>RSI {signal.rsi}</span>
                <span>MA(5) {signal.maShort}</span>
                <span>MA(14) {signal.maLong}</span>
                <span>{signal.sentiment} news</span>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {!premium ? (
        <section className="panel premium-strip">
          <div>
            <div className="eyebrow">Premium preview</div>
            <h2>Want the full board?</h2>
            <p className="muted-copy">Upgrade to unlock the rest of the signal feed, detailed stock descriptions, earnings context, historical trend analysis, and full AI reasoning.</p>
          </div>
          <a className="primary-button link-button" href="/subscription">
            Upgrade to Premium
          </a>
        </section>
      ) : null}
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
  const symbols = board.slice(0, 6).map((stock) => stock.symbol);
  const signals = await Promise.all(symbols.map((symbol) => fetchSteadySignal(symbol)));

  return {
    props: {
      session,
      premium: session.user.premium,
      signals
    }
  };
};
