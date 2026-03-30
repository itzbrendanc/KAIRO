import Link from "next/link";
import { KairoLogo } from "@/components/branding/kairo-logo";
import { ACADEMY_LESSONS } from "@/data/academy-lessons";

export default function AcademyPage() {
  const featured = ACADEMY_LESSONS[0];
  const lessonTrack = ACADEMY_LESSONS.slice(1);

  return (
    <div className="page stack public-page">
      <section className="panel academy-hero">
        <div className="academy-hero-copy">
          <KairoLogo size="sm" />
          <div className="eyebrow">KAIRO Academy</div>
          <h1>AI-crafted lessons for serious new investors</h1>
          <p className="muted-copy">
            KAIRO Academy now teaches inside the product. Every lesson is written as a custom step in the KAIRO learning track, with practical process, money management, and strategy guidance instead of sending users away to YouTube.
          </p>
          <div className="hero-controls">
            <Link className="primary-button link-button" href="/portfolio">
              Practice in Paper Trading
            </Link>
            <Link className="ghost-button link-button" href="/solutions">
              Explore Strategy Guides
            </Link>
          </div>
        </div>

        <div className="academy-hero-panel">
          <div className="lesson-step-badge">Featured lesson</div>
          <h2>{featured.title}</h2>
          <p className="muted-copy">{featured.description}</p>
          <div className="signal-metrics">
            <span>{featured.duration}</span>
            <span>{featured.category}</span>
            {featured.outcomes.map((outcome) => (
              <span key={outcome}>{outcome}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="academy-layout">
        <div className="stack">
          {ACADEMY_LESSONS.map((lesson) => (
            <article key={lesson.step} className="panel academy-lesson-card">
              <div className="academy-lesson-top">
                <div>
                  <div className="lesson-step-badge">Step {lesson.step}</div>
                  <div className="eyebrow">{lesson.category}</div>
                  <h2>{lesson.title}</h2>
                </div>
                <div className="academy-duration">{lesson.duration}</div>
              </div>

              <p className="muted-copy">{lesson.summary}</p>
              <p className="academy-core-idea">
                <strong>Core idea:</strong> {lesson.coreIdea}
              </p>

              <div className="academy-section-grid">
                <div className="lesson-card academy-subcard">
                  <strong>What you will do</strong>
                  <ul className="academy-list">
                    {lesson.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>

                <div className="lesson-card academy-subcard">
                  <strong>Common mistakes</strong>
                  <ul className="academy-list">
                    {lesson.mistakes.map((mistake) => (
                      <li key={mistake}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lesson-card academy-ai-box">
                <div className="eyebrow">KAIRO lesson note</div>
                <p className="muted-copy">{lesson.aiLesson}</p>
              </div>
            </article>
          ))}
        </div>

        <aside className="stack">
          <div className="panel academy-side-card">
            <div className="eyebrow">Lesson outcomes</div>
            <h2>What users learn</h2>
            <div className="signal-metrics">
              {ACADEMY_LESSONS.flatMap((lesson) => lesson.outcomes).map((outcome) => (
                <span key={outcome}>{outcome}</span>
              ))}
            </div>
          </div>

          <div className="panel academy-side-card">
            <div className="eyebrow">Workflow</div>
            <h2>Learn, then apply</h2>
            <p className="muted-copy">
              The best way to use the academy is to study one lesson, then immediately apply it in the watchlist, stock-analysis, and paper-trading areas of KAIRO.
            </p>
            <div className="hero-controls">
              <Link className="ghost-button link-button" href="/dashboard">
                Open Dashboard
              </Link>
              <Link className="primary-button link-button" href="/market-activity">
                Open Market Activity
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
