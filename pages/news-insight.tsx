import type { GetServerSideProps } from "next";
import Link from "next/link";
import { KairoLogo } from "@/components/branding/kairo-logo";
import { fetchNews } from "@/lib/market-data";
import { STOCKS } from "@/data/stocks";

type HeadlineItem = Awaited<ReturnType<typeof fetchNews>>[number] & {
  symbol: string;
  company: string;
};

function scoreInsight(item: HeadlineItem) {
  const ageHours = Math.max(
    0,
    (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60)
  );
  const recency = Math.max(0, 18 - ageHours);
  const sentiment = item.sentiment === "neutral" ? 0 : 0.75;
  return recency + sentiment;
}

export default function NewsInsightPage({
  headlines
}: {
  headlines: HeadlineItem[];
}) {
  const spotlight = headlines.slice(0, 6);

  return (
    <div className="page stack public-page">
      <section className="panel public-hero">
        <KairoLogo size="sm" />
        <div className="eyebrow">News and insight</div>
        <h1>Important live headlines, ranked for investors</h1>
        <p className="muted-copy">
          KAIRO pulls together the strongest live headlines across the tracked market universe, then surfaces the stories most likely to matter for earnings, guidance, risk, and momentum.
        </p>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Headline feed</div>
              <h2>Top market stories</h2>
              <p className="muted-copy">
                This is the main market-news stream for users who want the Yahoo-style experience of scanning recent high-importance headlines across multiple names.
              </p>
            </div>
          </div>
          <div className="news-list">
            {spotlight.map((item) => (
              <a key={`${item.symbol}-${item.title}`} href={item.url} className="news-card" target="_blank" rel="noreferrer">
                <div className="news-headline-row">
                  <strong>{item.title}</strong>
                  <span className={`news-sentiment news-${item.sentiment}`}>{item.sentiment}</span>
                </div>
                <span>{item.summary}</span>
                <small>
                  {item.symbol} · {item.company} · {item.source} · {new Date(item.publishedAt).toLocaleString()}
                </small>
              </a>
            ))}
          </div>
        </div>

        <div className="stack compact-stack">
          <div className="panel terminal-panel">
            <div className="eyebrow">How to use it</div>
            <h2>Reading market context</h2>
            <p className="muted-copy">
              Focus first on earnings, guidance, downgrades, legal risk, leadership changes, and macro headlines. Those are the stories most likely to shift narrative and price behavior quickly.
            </p>
          </div>

          <div className="panel terminal-panel">
            <div className="eyebrow">Next step</div>
            <h2>Move from news to action</h2>
            <p className="muted-copy">
              After scanning the story feed, jump into the stock detail page to compare the chart, sentiment, and AI signal for the same symbol inside one workflow.
            </p>
            <Link className="primary-button link-button" href="/market-activity">
              Open Market Activity
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const symbols = STOCKS.slice(0, 10);
  const headlineSets = await Promise.all(
    symbols.map(async (stock) => {
      const items = await fetchNews(stock.symbol);
      return items
        .filter((item) => item.isLive)
        .map((item) => ({
          ...item,
          symbol: stock.symbol,
          company: stock.company
        }));
    })
  );

  const headlines = headlineSets
    .flat()
    .sort((left, right) => scoreInsight(right) - scoreInsight(left))
    .slice(0, 18);

  return {
    props: {
      headlines
    }
  };
};
