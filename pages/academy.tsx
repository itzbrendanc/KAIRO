import Link from "next/link";
import { useState } from "react";
import { KairoLogo } from "@/components/branding/kairo-logo";
import { ACADEMY_LESSONS } from "@/data/academy-lessons";

export default function AcademyPage() {
  const [activeStep, setActiveStep] = useState(ACADEMY_LESSONS[0]?.step ?? 1);
  const activeLesson = ACADEMY_LESSONS.find((lesson) => lesson.step === activeStep) ?? ACADEMY_LESSONS[0];

  return (
    <div className="page stack public-page">
      <section className="panel academy-hero">
        <div className="academy-hero-copy">
          <KairoLogo size="sm" />
          <div className="eyebrow">KAIRO Academy</div>
          <h1>AI-crafted lessons for serious new investors</h1>
          <p className="muted-copy">
            KAIRO Academy now teaches inside the product. Every lesson is written as a custom learning module with practical process, money management, and strategy guidance instead of sending users away to YouTube.
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
          <div className="lesson-step-badge">Now playing</div>
          <h2>{activeLesson.title}</h2>
          <p className="muted-copy">{activeLesson.description}</p>
          <div className="signal-metrics">
            <span>{activeLesson.duration}</span>
            <span>{activeLesson.category}</span>
            {activeLesson.outcomes.map((outcome) => (
              <span key={outcome}>{outcome}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="academy-layout">
        <div className="stack academy-main-column">
          <section className="panel academy-player">
            <div className="academy-player-head">
              <div>
                <div className="lesson-step-badge">Lesson {activeLesson.step}</div>
                <div className="eyebrow">{activeLesson.category}</div>
                <h2>{activeLesson.title}</h2>
              </div>
              <div className="academy-duration">{activeLesson.duration}</div>
            </div>

            <div className="academy-video-shell">
              <div className="academy-video-screen">
                <div className="academy-video-glow" aria-hidden="true" />
                <div className="academy-video-badge">KAIRO Lesson Mode</div>
                <h3>{activeLesson.summary}</h3>
                <p>{activeLesson.aiLesson}</p>
              </div>
            </div>

            <p className="academy-core-idea">
              <strong>Core idea:</strong> {activeLesson.coreIdea}
            </p>

            <div className="academy-section-grid">
              <div className="lesson-card academy-subcard">
                <strong>What you will do</strong>
                <ul className="academy-list">
                  {activeLesson.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>

              <div className="lesson-card academy-subcard">
                <strong>Common mistakes</strong>
                <ul className="academy-list">
                  {activeLesson.mistakes.map((mistake) => (
                    <li key={mistake}>{mistake}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="lesson-card academy-ai-box">
              <div className="eyebrow">KAIRO lesson note</div>
              <p className="muted-copy">{activeLesson.aiLesson}</p>
            </div>
          </section>
        </div>

        <aside className="stack">
          <div className="panel academy-side-card">
            <div className="eyebrow">Lesson track</div>
            <h2>Choose a step</h2>
            <div className="academy-track">
              {ACADEMY_LESSONS.map((lesson) => (
                <button
                  key={lesson.step}
                  className={`academy-track-item ${lesson.step === activeLesson.step ? "academy-track-item-active" : ""}`}
                  onClick={() => setActiveStep(lesson.step)}
                >
                  <span>Step {lesson.step}</span>
                  <strong>{lesson.title}</strong>
                  <small>{lesson.duration}</small>
                </button>
              ))}
            </div>
          </div>

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
