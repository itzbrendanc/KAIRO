import Link from "next/link";
import { KairoLogo } from "@/components/branding/kairo-logo";
import { ACADEMY_LESSONS } from "@/data/academy-lessons";

export default function AcademyPage() {
  return (
    <div className="page stack public-page">
      <section className="panel public-hero">
        <KairoLogo size="sm" />
        <div className="eyebrow">KAIRO Academy</div>
        <h1>Step-by-step lessons for new investors</h1>
        <p className="muted-copy">
          KAIRO Academy organizes beginner investing and trading education into a guided sequence, with YouTube-style lesson links by topic so users can learn process, strategy, and money management in order.
        </p>
      </section>

      <section className="panel terminal-panel">
        <div className="section-header">
          <div>
            <div className="eyebrow">Learning path</div>
            <h2>Professional-style lesson sequence</h2>
            <p className="muted-copy">
              Start at step one and work forward. Each lesson focuses on one part of the investing process so users build a foundation before taking more risk.
            </p>
          </div>
        </div>
        <div className="card-grid academy-grid">
          {ACADEMY_LESSONS.map((lesson) => (
            <div key={lesson.step} className="lesson-card lesson-video-card">
              <div className="lesson-step-badge">Step {lesson.step}</div>
              <div className="eyebrow">{lesson.category}</div>
              <h3>{lesson.title}</h3>
              <p className="muted-copy">{lesson.summary}</p>
              <div className="signal-metrics">
                <span>{lesson.duration}</span>
                {lesson.outcomes.map((outcome) => (
                  <span key={outcome}>{outcome}</span>
                ))}
              </div>
              <div className="hero-controls">
                <a
                  className="primary-button link-button"
                  href={lesson.watchUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Watch Lesson
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="two-column">
        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Focus area</div>
              <h2>Money management first</h2>
            </div>
          </div>
          <p className="muted-copy">
            The academy puts money management near the front of the journey on purpose. Most new investors spend too much time hunting for entries and not enough time learning risk, sizing, and drawdown control.
          </p>
        </div>

        <div className="panel terminal-panel">
          <div className="section-header">
            <div>
              <div className="eyebrow">Next step</div>
              <h2>Practice with KAIRO tools</h2>
            </div>
          </div>
          <p className="muted-copy">
            After each lesson, users can move into the paper-trading simulator, market activity page, and stock analysis pages to put the lesson into a real workflow.
          </p>
          <div className="hero-controls">
            <Link className="ghost-button link-button" href="/portfolio">
              Open Paper Trading
            </Link>
            <Link className="primary-button link-button" href="/solutions">
              Read More Lessons
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
