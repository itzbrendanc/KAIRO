export type AcademyLesson = {
  step: number;
  title: string;
  duration: string;
  category: string;
  summary: string;
  description: string;
  coreIdea: string;
  outcomes: string[];
  steps: string[];
  mistakes: string[];
  aiLesson: string;
};

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    step: 1,
    title: "How markets work for beginners",
    duration: "12 min",
    category: "Foundations",
    summary:
      "Start with the basics: what stocks, ETFs, indexes, crypto, and currencies are, and how price moves when buyers and sellers compete.",
    description:
      "This opening lesson teaches the language of the market so a new investor can understand what they are looking at before trying to make decisions with real money.",
    coreIdea:
      "Before you ever rate a stock as good or bad, you need to know whether you are studying a company, an ETF, an index proxy, a currency pair, or a crypto asset.",
    outcomes: [
      "Understand what you are actually buying",
      "Learn the difference between investing and trading",
      "Read market structure before choosing a stock"
    ],
    steps: [
      "Start with the major benchmarks and understand what the S&P 500, Nasdaq, and Dow actually represent.",
      "Learn the difference between one stock and a basket like an ETF.",
      "Understand that price moves because market participants keep repricing future expectations."
    ],
    mistakes: [
      "Jumping into a trade without understanding the asset class",
      "Confusing a strong market with a strong stock",
      "Ignoring the broader environment behind a move"
    ],
    aiLesson:
      "KAIRO reads market context first because broad conditions usually shape whether individual setups are worth trusting."
  },
  {
    step: 2,
    title: "Building a watchlist and finding setups",
    duration: "15 min",
    category: "Workflow",
    summary:
      "Learn how experienced traders narrow the market down into a few names worth watching instead of chasing random tickers.",
    description:
      "The goal of this lesson is to teach selection. A smaller, focused watchlist usually leads to better decisions than trying to react to everything at once.",
    coreIdea:
      "A watchlist is not just a list of popular symbols. It is a shortlist of names with clear catalysts, clean structure, and a reason to deserve attention today.",
    outcomes: [
      "Build a focused watchlist",
      "Spot trend strength and sector leadership",
      "Use catalysts to prioritize names"
    ],
    steps: [
      "Start with sectors showing real strength or weakness.",
      "Choose names with clear trend structure and strong volume participation.",
      "Rank your list by catalyst quality and chart clarity."
    ],
    mistakes: [
      "Tracking too many names",
      "Picking symbols only because they are trending on social media",
      "Ignoring the difference between watchlist quality and watchlist size"
    ],
    aiLesson:
      "KAIRO’s watchlist tools work best when the user tracks names with intent rather than collecting random tickers."
  },
  {
    step: 3,
    title: "Risk management and position sizing",
    duration: "18 min",
    category: "Money Management",
    summary:
      "This lesson teaches the skill most beginners ignore: how much to risk, where to exit, and how to survive long enough to improve.",
    description:
      "Money management is what keeps a trading plan alive. Without it, even good ideas can turn into account damage.",
    coreIdea:
      "Your first job is not to maximize return. Your first job is to control risk so one bad decision never defines your month.",
    outcomes: [
      "Limit loss per trade",
      "Use stop levels with purpose",
      "Size positions based on risk, not emotion"
    ],
    steps: [
      "Decide how much account capital you are willing to risk on one idea.",
      "Set an invalidation point before you enter the trade.",
      "Calculate size from the stop distance instead of guessing."
    ],
    mistakes: [
      "Increasing position size after a losing streak",
      "Using stops that have no structural meaning",
      "Treating conviction as a substitute for risk control"
    ],
    aiLesson:
      "KAIRO’s paper-trading and lesson flow are designed to help users build survival habits before they chase performance."
  },
  {
    step: 4,
    title: "Trend following, swing trading, and entries",
    duration: "16 min",
    category: "Strategies",
    summary:
      "See how professionals use trend, pullbacks, breakouts, and moving averages to decide when a trade is worth taking.",
    description:
      "This lesson helps users understand how setups form so they can tell the difference between a disciplined trend entry and a late emotional chase.",
    coreIdea:
      "The best entries usually happen when price, momentum, and structure align rather than when a move already feels obvious to everyone.",
    outcomes: [
      "Identify trend continuation setups",
      "Learn common swing entry logic",
      "Avoid chasing low-quality moves"
    ],
    steps: [
      "Find a stock already moving with clear trend structure.",
      "Wait for a pullback, base, or breakout with a defined level.",
      "Use trend and momentum indicators to confirm the setup."
    ],
    mistakes: [
      "Buying extended breakouts without a plan",
      "Ignoring the broader market when taking a trend trade",
      "Entering because a move looks exciting instead of technically clean"
    ],
    aiLesson:
      "KAIRO uses moving averages, RSI, MACD, and trendline structure to explain why a setup is strong, weak, or mixed."
  },
  {
    step: 5,
    title: "Reading earnings, news, and catalysts",
    duration: "14 min",
    category: "Catalysts",
    summary:
      "Understand how earnings reports, guidance changes, and macro events can shift a stock faster than technicals alone.",
    description:
      "Catalysts can completely reprice a stock. This lesson teaches users when to trust the chart and when to respect the event calendar first.",
    coreIdea:
      "A clean chart can still fail quickly around earnings, guidance changes, regulatory headlines, or large macro surprises.",
    outcomes: [
      "Read earnings risk correctly",
      "Separate important news from noise",
      "Use catalysts to improve timing"
    ],
    steps: [
      "Check whether earnings or guidance is near before entering.",
      "Read headline importance instead of reacting to every article equally.",
      "Let catalysts change your conviction only when they affect the actual thesis."
    ],
    mistakes: [
      "Holding size blindly into earnings",
      "Treating every headline as equally important",
      "Ignoring how catalysts can shift volatility and spreads"
    ],
    aiLesson:
      "KAIRO ranks news by importance and adds earnings context because catalyst quality often matters more than raw headline quantity."
  },
  {
    step: 6,
    title: "Journaling, review, and compounding skill",
    duration: "11 min",
    category: "Discipline",
    summary:
      "Professional progress comes from reviewing trades, journaling mistakes, and repeating a process with discipline.",
    description:
      "The last lesson turns all of the earlier material into a repeatable loop. This is how new investors stop repeating the same mistakes.",
    coreIdea:
      "Growth comes from review. If you never study your entries, exits, and reasoning, the market will keep charging tuition.",
    outcomes: [
      "Build a review habit",
      "Turn losses into lessons",
      "Create a repeatable decision framework"
    ],
    steps: [
      "Journal the thesis before the trade, not after.",
      "Review both winners and losers to separate luck from process.",
      "Update your rules based on recurring mistakes."
    ],
    mistakes: [
      "Only reviewing losing trades",
      "Writing vague notes with no decision logic",
      "Changing strategy constantly instead of refining one process"
    ],
    aiLesson:
      "KAIRO’s learning flow is strongest when the academy, watchlists, paper trading, and signal reviews are used together as one process."
  }
];
