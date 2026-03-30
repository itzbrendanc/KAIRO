export type AcademyLesson = {
  step: number;
  title: string;
  duration: string;
  category: string;
  summary: string;
  outcomes: string[];
  watchUrl: string;
};

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    step: 1,
    title: "How markets work for beginners",
    duration: "12 min",
    category: "Foundations",
    summary:
      "Start with the basics: what stocks, ETFs, indexes, crypto, and currencies are, and how price moves when buyers and sellers compete.",
    outcomes: [
      "Understand what you are actually buying",
      "Learn the difference between investing and trading",
      "Read market structure before choosing a stock"
    ],
    watchUrl: "https://www.youtube.com/results?search_query=professional+investor+how+stock+market+works+for+beginners"
  },
  {
    step: 2,
    title: "Building a watchlist and finding setups",
    duration: "15 min",
    category: "Workflow",
    summary:
      "Learn how experienced traders narrow the market down into a few names worth watching instead of chasing random tickers.",
    outcomes: [
      "Build a focused watchlist",
      "Spot trend strength and sector leadership",
      "Use catalysts to prioritize names"
    ],
    watchUrl: "https://www.youtube.com/results?search_query=professional+trader+watchlist+strategy+for+beginners"
  },
  {
    step: 3,
    title: "Risk management and position sizing",
    duration: "18 min",
    category: "Money Management",
    summary:
      "This lesson teaches the skill most beginners ignore: how much to risk, where to exit, and how to survive long enough to improve.",
    outcomes: [
      "Limit loss per trade",
      "Use stop levels with purpose",
      "Size positions based on risk, not emotion"
    ],
    watchUrl: "https://www.youtube.com/results?search_query=professional+trader+risk+management+position+sizing+beginner"
  },
  {
    step: 4,
    title: "Trend following, swing trading, and entries",
    duration: "16 min",
    category: "Strategies",
    summary:
      "See how professionals use trend, pullbacks, breakouts, and moving averages to decide when a trade is worth taking.",
    outcomes: [
      "Identify trend continuation setups",
      "Learn common swing entry logic",
      "Avoid chasing low-quality moves"
    ],
    watchUrl: "https://www.youtube.com/results?search_query=professional+swing+trading+strategy+trend+following+beginners"
  },
  {
    step: 5,
    title: "Reading earnings, news, and catalysts",
    duration: "14 min",
    category: "Catalysts",
    summary:
      "Understand how earnings reports, guidance changes, and macro events can shift a stock faster than technicals alone.",
    outcomes: [
      "Read earnings risk correctly",
      "Separate important news from noise",
      "Use catalysts to improve timing"
    ],
    watchUrl: "https://www.youtube.com/results?search_query=professional+investor+earnings+analysis+for+beginners"
  },
  {
    step: 6,
    title: "Journaling, review, and compounding skill",
    duration: "11 min",
    category: "Discipline",
    summary:
      "Professional progress comes from reviewing trades, journaling mistakes, and repeating a process with discipline.",
    outcomes: [
      "Build a review habit",
      "Turn losses into lessons",
      "Create a repeatable decision framework"
    ],
    watchUrl: "https://www.youtube.com/results?search_query=professional+trader+journaling+review+discipline+beginners"
  }
];
