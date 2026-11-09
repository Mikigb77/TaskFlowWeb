import type { CSSProperties, ReactNode } from "react";
import Icon from "./Icon";
import VoiceDemo from "./VoiceDemo";
import { copy, type SiteLanguage } from "../content/site";
import { explore } from "../content/site/explore";
import { nova } from "../content/site/nova";

// Exploration: "Daybook". A printed planner and a front page: paper, ink, a red pen, a
// highlighter. The hero is a page of tomorrow being written as you speak.

const order = (i: number) => ({ "--i": i }) as CSSProperties;

function Line({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <span className="line" style={order(index)}>
      <span>{children}</span>
    </span>
  );
}

export default function HomeDaybook({ language }: { language: SiteLanguage }) {
  const { hero, features, faq, closing, voice } = copy[language];
  const n = nova[language];
  const d = explore[language].daybook;
  const index = [
    {
      icon: "mic",
      title: features.voice.title,
      body: features.voice.body,
    },
    {
      icon: "calendar",
      title: features.calendar.title,
      body: features.calendar.body,
    },
    {
      icon: "notes",
      title: features.details.title,
      body: features.details.body,
    },
    {
      icon: "wifiOff",
      title: features.offline.title,
      body: features.offline.body,
    },
  ];
  return (
    <div lang={language} className="daybook">
      {/* Masthead */}
      <div className="db-masthead container" aria-hidden="true">
        <span>{d.edition}</span>
        <span>{d.tagline}</span>
      </div>

      {/* 1. Front page */}
      <section className="db-hero container" aria-labelledby="hero-title">
        <div className="db-hero-copy">
          <h1 id="hero-title">
            <Line index={0}>{hero.title}</Line>
            <Line index={1}>
              <em className="db-red">{hero.titleAccent}</em>
            </Line>
          </h1>
          <div className="db-hero-columns">
            <p className="db-lede">{hero.description}</p>
            <div className="db-hero-side">
              <a href="#voice" className="button db-button">
                {hero.primary} <Icon name="arrow" />
              </a>
              <a href="#features" className="db-underline">
                {hero.secondary}
              </a>
              <p className="db-small">
                <mark>{hero.status}</mark> {hero.free}
              </p>
            </div>
          </div>
        </div>

        {/* A page of tomorrow, written as you speak. */}
        <div className="db-page" aria-hidden="true">
          <div className="db-page-head">
            <span>{d.tomorrow}</span>
            <span className="db-mic">
              <Icon name="mic" size={18} />
            </span>
          </div>
          <p className="db-typed">
            <span>{hero.voiceQuote}</span>
          </p>
          <div className="db-hours">
            {["8", "9", "10", "11", "12", "13"].map((h) => (
              <div key={h} className="db-hour">
                <time>{h}:00</time>
                {h === "10" && (
                  <span className="db-entry">
                    {features.calendar.events[0].title}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="db-todo">
            <strong>{d.todo}</strong>
            {voice.example.tasks.map((task, i) => (
              <p key={task.title} className="db-task" style={order(i)}>
                <span className="db-box">
                  <Icon name="check" size={14} />
                </span>
                <span className="db-task-text">{task.title}</span>
              </p>
            ))}
          </div>
          <span className="db-stamp">{voice.example.heading}</span>
        </div>
      </section>

      {/* 2. The method */}
      <section className="db-method" aria-labelledby="how-title">
        <div className="container">
          <h2 id="how-title" data-reveal>
            <Line>{n.howTitle}</Line>
          </h2>
          <ol>
            {n.steps.map((step, i) => (
              <li key={step.title} style={order(i)} data-reveal>
                <span className="db-numeral" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* 3. The demo */}
      <VoiceDemo />

      {/* 4. Index of features */}
      <section
        id="features"
        className="db-index container"
        aria-labelledby="features-title"
      >
        <div className="db-section-head">
          <span className="db-kicker">{d.indexTitle}</span>
          <h2 id="features-title" data-reveal>
            <Line>{features.title}</Line>
          </h2>
        </div>
        <ol className="db-rows">
          {index.map((row, i) => (
            <li key={row.title} data-reveal style={order(i)}>
              <span className="db-row-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3>
                <span className="db-hl">{row.title}</span>
              </h3>
              <p>{row.body}</p>
              <span className="db-row-icon" aria-hidden="true">
                <Icon name={row.icon} size={28} />
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. Meetings: a spread */}
      <section className="db-spread" aria-labelledby="meetings-title">
        <div className="container db-spread-inner">
          <div>
            <span className="db-kicker db-kicker-light">TaskFlow Pro</span>
            <h2 id="meetings-title">{features.meetings.title}</h2>
            <p>{features.meetings.body}</p>
          </div>
          <figure className="db-memo" aria-hidden="true">
            <strong>{features.meetings.note.title}</strong>
            <small>{features.meetings.note.header}</small>
            <blockquote>{features.meetings.note.summary}</blockquote>
            <span className="db-memo-label">
              {features.meetings.note.checklist}
            </span>
            {features.meetings.note.steps.map((step) => (
              <p key={step} className="db-memo-step">
                <span className="db-box"></span>
                {step}
              </p>
            ))}
            <span className="db-memo-label">
              {features.meetings.note.decisions}
            </span>
            <p className="db-memo-decision">
              {features.meetings.note.decision}
            </p>
          </figure>
        </div>
      </section>

      {/* 6. Plans, as two receipts */}
      <section className="db-plans container" aria-labelledby="plans-title">
        <h2 id="plans-title" data-reveal>
          <Line>{n.plansTitle}</Line>
        </h2>
        <div className="db-receipts">
          <article className="db-receipt" data-reveal>
            <header>
              <h3>{n.free.name}</h3>
              <span>{d.receiptFree}</span>
            </header>
            <ul>
              {n.free.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <footer>
              <span>€</span>
              <strong>{d.zero}</strong>
            </footer>
          </article>
          <article className="db-receipt db-receipt-pro" style={order(1)} data-reveal>
            <header>
              <h3>{n.pro.name}</h3>
              <span>{d.receiptPro}</span>
            </header>
            <ul>
              {n.pro.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <footer>
              <span>{n.pro.note}</span>
              <strong>{d.priceLater}</strong>
            </footer>
          </article>
        </div>
      </section>

      {/* 7. Questions */}
      <section
        id="questions"
        className="db-faq container"
        aria-labelledby="questions-title"
      >
        <div className="db-section-head">
          <span className="db-kicker">{n.questionsLead}</span>
          <h2 id="questions-title" data-reveal>
            <Line>{faq.title}</Line>
          </h2>
        </div>
        <div className="db-faq-list">
          {faq.items.map(({ question, answer }, i) => (
            <details key={question} className="faq-item db-q" style={order(Math.min(i, 6))} data-reveal>
              <summary>
                <span>{question}</span>
                <span className="faq-plus">
                  <Icon name="plus" size={18} />
                </span>
              </summary>
              {[answer].flat().map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </details>
          ))}
        </div>
      </section>

      {/* 8. Close: a stamp */}
      <section
        id="get-taskflow"
        className="db-closing container"
        aria-labelledby="closing-title"
      >
        <h2 id="closing-title" className="db-closing-stamp">
          {closing.title}
        </h2>
        <div className="db-closing-side">
          <p>{closing.body}</p>
          <a href="#voice" className="button db-button">
            {closing.button} <Icon name="arrow" />
          </a>
        </div>
      </section>
    </div>
  );
}
