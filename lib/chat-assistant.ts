import { ACADEMY_LESSONS } from "@/data/academy-lessons";
import { MARKET_UNIVERSE } from "@/data/market-universe";
import { fetchInfowayPrice, fetchNews, fetchSteadySignal, getMarketBoard } from "@/lib/market-data";
import { formatCurrency, formatPercent } from "@/lib/format";

function detectSymbol(question: string) {
  const upper = question.toUpperCase();
  return MARKET_UNIVERSE.find((item) => upper.includes(item.symbol))?.symbol ?? null;
}

function findLesson(question: string) {
  const normalized = question.toLowerCase();
  return (
    ACADEMY_LESSONS.find((lesson) =>
      [lesson.title, lesson.category, lesson.summary, lesson.coreIdea].some((value) =>
        value.toLowerCase().split(/\s+/).some((token) => token.length > 4 && normalized.includes(token))
      )
    ) ?? null
  );
}

export async function generateChatReply(question: string) {
  const normalized = question.trim().toLowerCase();
  const symbol = detectSymbol(question);

  if (symbol) {
    const [quote, signal, news] = await Promise.all([
      fetchInfowayPrice(symbol, { includeHistory: true }),
      fetchSteadySignal(symbol),
      fetchNews(symbol)
    ]);

    const topHeadline = news.find((item) => item.isLive) ?? null;
    const earningsLine = signal.earnings.nextDate
      ? `Next earnings date: ${signal.earnings.nextDate}${signal.earnings.period ? ` (${signal.earnings.period})` : ""}.`
      : "There is no live upcoming earnings date in the current feed.";

    return {
      title: `${quote.company} analysis`,
      answer: `${quote.company} (${quote.symbol}) is currently ${signal.recommendation} rated by KAIRO. The stock is trading at ${formatCurrency(quote.price)}, with a move of ${formatPercent(quote.changePercent)}. ${signal.stockSummary} ${signal.explanation} ${earningsLine}${topHeadline ? ` Most important live headline: ${topHeadline.title}` : ""}`,
      suggestions: [
        `What are the risks for ${quote.symbol}?`,
        `Explain ${quote.symbol} earnings`,
        `How should I manage risk on ${quote.symbol}?`
      ]
    };
  }

  if (normalized.includes("market") || normalized.includes("today") || normalized.includes("overview")) {
    const board = await getMarketBoard();
    const gainers = [...board].sort((a, b) => b.changePercent - a.changePercent).slice(0, 3);
    const losers = [...board].sort((a, b) => a.changePercent - b.changePercent).slice(0, 3);

    return {
      title: "Market overview",
      answer: `Here is the current KAIRO market read. Top strength: ${gainers
        .map((item) => `${item.symbol} ${formatPercent(item.changePercent)}`)
        .join(", ")}. Main weakness: ${losers
        .map((item) => `${item.symbol} ${formatPercent(item.changePercent)}`)
        .join(", ")}. Use the market activity page to compare equities, crypto, currencies, and benchmark proxies side by side.`,
      suggestions: [
        "Which sectors look strongest right now?",
        "Give me the best stocks to watch today",
        "Summarize the market in plain English"
      ]
    };
  }

  if (normalized.includes("risk") || normalized.includes("money management") || normalized.includes("position size")) {
    const lesson =
      ACADEMY_LESSONS.find((item) => item.category === "Money Management") ?? ACADEMY_LESSONS[2];
    return {
      title: lesson.title,
      answer: `${lesson.description} Core idea: ${lesson.coreIdea} The most important actions are: ${lesson.steps.join(" ")} Avoid these mistakes: ${lesson.mistakes.join(" ")}`
    };
  }

  const lesson = findLesson(question);
  if (lesson) {
    return {
      title: lesson.title,
      answer: `${lesson.description} Core idea: ${lesson.coreIdea} What you should do: ${lesson.steps.join(" ")} Common mistakes: ${lesson.mistakes.join(" ")}`
    };
  }

  return {
    title: "KAIRO Assistant",
    answer:
      "I can help with stock analysis, buy/hold/sell ratings, earnings context, market summaries, trading strategy, money management, watchlist ideas, and beginner lessons. Try asking about a stock symbol like AAPL, a market question like 'What matters today?', or a lesson topic like risk management."
  };
}
