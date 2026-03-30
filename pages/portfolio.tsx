import { useState } from "react";
import type { GetServerSideProps } from "next";
import { getPageSession } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";

export default function PortfolioPage({
  trades
}: {
  trades: Array<{
    id: number;
    symbol: string;
    side: string;
    quantity: number;
    price: number;
    thesis: string;
    createdAt: string;
  }>;
}) {
  const [paperTrades, setPaperTrades] = useState(trades);
  const [form, setForm] = useState({
    symbol: "AAPL",
    side: "BUY",
    quantity: 5,
    price: 190,
    thesis: "The trend is improving and I want to practice disciplined entries."
  });

  const tips = [
    "Risk a small fixed amount per trade so one mistake does not define your week.",
    "Wait for your setup instead of chasing price after a large move.",
    "Write down the reason for every trade before entering it.",
    "Review losing paper trades to learn whether the idea or the execution failed."
  ];

  const lessons = [
    {
      title: "What RSI tells you",
      body: "RSI measures short-term momentum. Very high readings can signal an overheated move, while very low readings can point to weak conditions or an oversold bounce setup."
    },
    {
      title: "Why moving averages matter",
      body: "Short moving averages help show recent trend direction. When price stays above both short and long averages, momentum is usually healthier than when price falls below both."
    },
    {
      title: "News changes the context",
      body: "A strong chart can weaken quickly if the latest headlines turn negative. KAIRO combines technical structure with news sentiment so the signal is not based on price alone."
    }
  ];

  const totalExposure = paperTrades.reduce((sum, trade) => sum + trade.quantity * trade.price, 0);
  const points = paperTrades.reduce((sum, trade) => {
    let tradePoints = 10;
    if (trade.thesis.trim().length >= 60) tradePoints += 10;
    if (trade.side === "HOLD") tradePoints += 4;
    return sum + tradePoints;
  }, 0);
  const journalDays = Array.from(
    new Set(
      paperTrades.map((trade) =>
        new Date(trade.createdAt).toISOString().slice(0, 10)
      )
    )
  ).sort((left, right) => new Date(right).getTime() - new Date(left).getTime());
  const streak = journalDays.reduce((count, day, index) => {
    if (index === 0) return 1;
    const previous = new Date(journalDays[index - 1]);
    const current = new Date(day);
    const diff = Math.round((previous.getTime() - current.getTime()) / 86400000);
    return diff === 1 && count === index ? count + 1 : count;
  }, 0);
  const badgeDefinitions = [
    {
      name: "Beginner",
      unlocked: paperTrades.length >= 1,
      description: "Logged your first paper trade."
    },
    {
      name: "Intermediate",
      unlocked: paperTrades.length >= 5 && points >= 80,
      description: "Built a consistent journal with multiple trade ideas."
    },
    {
      name: "Disciplined",
      unlocked: streak >= 3,
      description: "Journaled trades on three consecutive days."
    }
  ];
  const unlockedBadges = badgeDefinitions.filter((badge) => badge.unlocked);
  const topBadge = unlockedBadges[unlockedBadges.length - 1]?.name ?? "Unranked";

  function addPaperTrade() {
    const nextTrade = {
      id: Date.now(),
      symbol: form.symbol.toUpperCase(),
      side: form.side,
      quantity: Number(form.quantity),
      price: Number(form.price),
      thesis: form.thesis,
      createdAt: new Date().toISOString()
    };

    setPaperTrades((current) => [nextTrade, ...current]);
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="eyebrow">Practice portfolio</div>
        <h1>Paper Trading Log</h1>
        <p className="muted-copy">
          Use this area to review saved simulated trades and build discipline before risking real capital.
        </p>
      </section>

      <section className="grid-3">
        <div className="panel stat-card">
          <div className="stat-label">Saved trades</div>
          <div className="stat-value">{paperTrades.length}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Exposure</div>
          <div className="stat-value">{formatCurrency(totalExposure)}</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Mode</div>
          <div className="stat-value">Simulation</div>
        </div>
      </section>

      <section className="grid-3">
        <div className="panel stat-card">
          <div className="stat-label">Learning points</div>
          <div className="stat-value">{points}</div>
          <div className="stat-helper">Earn points for completing and journaling paper trades.</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Journal streak</div>
          <div className="stat-value">{streak} day{streak === 1 ? "" : "s"}</div>
          <div className="stat-helper">Add trades on consecutive days to keep your streak alive.</div>
        </div>
        <div className="panel stat-card">
          <div className="stat-label">Top badge</div>
          <div className="stat-value">
            {topBadge}
          </div>
          <div className="stat-helper">Progress from beginner to disciplined trader.</div>
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Paper trading</div>
              <h2>Simulate a trade</h2>
            </div>
          </div>
          <div className="stack compact-stack">
            <div className="two-field-grid">
              <input
                className="text-input"
                value={form.symbol}
                onChange={(event) => setForm((current) => ({ ...current, symbol: event.target.value.toUpperCase() }))}
                placeholder="Symbol"
              />
              <select
                className="text-input"
                value={form.side}
                onChange={(event) => setForm((current) => ({ ...current, side: event.target.value }))}
              >
                <option value="BUY">BUY</option>
                <option value="HOLD">HOLD</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
            <div className="two-field-grid">
              <input
                className="text-input"
                type="number"
                min="1"
                value={form.quantity}
                onChange={(event) => setForm((current) => ({ ...current, quantity: Number(event.target.value) }))}
                placeholder="Quantity"
              />
              <input
                className="text-input"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(event) => setForm((current) => ({ ...current, price: Number(event.target.value) }))}
                placeholder="Price"
              />
            </div>
            <textarea
              className="text-input text-area"
              value={form.thesis}
              onChange={(event) => setForm((current) => ({ ...current, thesis: event.target.value }))}
              placeholder="Why are you taking this trade?"
            />
            <button className="primary-button" onClick={addPaperTrade}>
              Add Paper Trade
            </button>
            <p className="muted-copy">
              This simulator is for learning. It helps you practice entries, sizing, and trade journaling before risking real money.
            </p>
          </div>
        </div>

        <div className="stack compact-stack">
          <div className="panel">
            <div className="eyebrow">Progress</div>
            <h2>Badges</h2>
            <div className="badge-grid">
              {badgeDefinitions.map((badge) => (
                <div key={badge.name} className={`badge-card ${badge.unlocked ? "badge-active" : ""}`}>
                  <strong>{badge.name}</strong>
                  <p className="muted-copy">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="eyebrow">Trading tips</div>
            <h2>Short lessons for new traders</h2>
            <div className="tips-list">
              {tips.map((tip) => (
                <div key={tip} className="tip-card">
                  {tip}
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="eyebrow">Learning center</div>
            <h2>Core concepts</h2>
            <div className="lesson-list">
              {lessons.map((lesson) => (
                <div key={lesson.title} className="lesson-card">
                  <strong>{lesson.title}</strong>
                  <p className="muted-copy">{lesson.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Trade journal</div>
            <h2>Paper trading log</h2>
          </div>
        </div>
        <div className="table">
          <div className="table-row table-head learning-table">
            <span>Symbol</span>
            <span>Side</span>
            <span>Quantity</span>
            <span>Price</span>
            <span>Thesis</span>
          </div>
          {paperTrades.map((trade) => (
            <div key={trade.id} className="table-row learning-table">
              <span>{trade.symbol}</span>
              <span>{trade.side}</span>
              <span>{trade.quantity}</span>
              <span>{formatCurrency(trade.price)}</span>
              <span>{trade.thesis}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getPageSession(context);

  const trades = [
    {
      id: 1,
      symbol: "AAPL",
      side: "BUY",
      quantity: 10,
      price: 192.44,
      thesis: "Momentum and services strength support a bullish swing idea.",
      createdAt: new Date().toISOString()
    },
    {
      id: 2,
      symbol: "MSFT",
      side: "HOLD",
      quantity: 6,
      price: 428.12,
      thesis: "Trend remains healthy but entry is extended, so patience is favored.",
      createdAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  return {
    props: {
      session,
      trades
    }
  };
};
