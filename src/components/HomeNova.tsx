import type { CSSProperties, ReactNode } from "react";
import Icon from "./Icon";
import VoiceDemo from "./VoiceDemo";
import { copy, type SiteLanguage } from "../content/site";
import { nova } from "../content/site/nova";

// Exploration: "Nova", a new home page. Same information as the current site, reordered:
// the promise, how it works, the live demo, five feature chapters, Free and Pro, questions,
// and a loud closing.

// A stagger index for an entrance, read by global.css as --i.
const order = (i: number) => ({ "--i": i }) as CSSProperties;

function Line({
  children,
  index = 0,
}: {
  children: ReactNode;
  index?: number;
}) {
  return (
    <span className="line" style={order(index)}>
      <span>{children}</span>
    </span>
  );
}

// The app, redrawn in Nova's colours and type: tomorrow on the calendar, the two things
// just said, and the one button. A design proposal, not a screenshot.
function NovaPhone({ language }: { language: SiteLanguage }) {
  const { hero, features, voice } = copy[language];
  const app = nova[language].app;
  const tabs = ["calendar", "check", "notes", "sliders"];
  return (
    <div className="nv-device" role="img" aria-label={hero.imageAlt}>
      <span className="nv-device-camera" aria-hidden="true"></span>
      <div className="nv-screen" aria-hidden="true">
        <div className="nv-app-bar">
          <span className="nv-app-brand">
            <span className="nv-app-mark">
              <Icon name="logo" size={14} />
            </span>
            <span>
              taskflow<span className="nv-app-dot">.</span>
            </span>
          </span>
          <span className="nv-app-avatar"></span>
        </div>
        <p className="nv-app-kicker">{app.greeting}</p>
        <div className="nv-app-week">
          {features.calendar.weekdays.map((day, i) => (
            <span key={i} className={i === 4 ? "is-on" : ""}>
              <small>{day}</small>
              {19 + i}
              {(i === 0 || i === 2 || i === 4) && <i></i>}
            </span>
          ))}
        </div>
        <p className="nv-app-day">{voice.tomorrow}</p>
        <div className="nv-app-list">
          <div className="nv-app-event">
            <time>10:00</time>
            <div>
              <strong>{features.calendar.events[0].title}</strong>
              <small>{features.calendar.events[0].detail}</small>
            </div>
          </div>
          {voice.example.tasks.map((task, i) => (
            <div key={task.title} className={`nv-app-task nv-app-task-${i}`}>
              <span className="nv-app-check"></span>
              <strong>{task.title}</strong>
              <Icon name="spark" size={13} className="nv-app-new" />
            </div>
          ))}
        </div>
        <div className="nv-app-fab">
          <span className="nv-app-fab-ring"></span>
          <Icon name="mic" size={20} />
          {app.addTask}
        </div>
        <nav className="nv-app-tabs">
          {app.tabs.map((label, i) => (
            <span key={label} className={i === 0 ? "is-on" : ""}>
              <Icon name={tabs[i]} size={17} />
              {label}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

function Num({ n }: { n: number }) {
  return (
    <span className="nv-num" aria-hidden="true">
      {String(n).padStart(2, "0")}
    </span>
  );
}

export default function HomeNova({ language }: { language: SiteLanguage }) {
  const { hero, features, faq, closing, voice, frame } = copy[language];
  const n = nova[language];
  const chapters = [
    features.voice.title,
    features.calendar.title,
    features.meetings.title,
    features.details.title,
    features.offline.title,
  ];
  return (
    <div lang={language} className="nova">
      {/* 1. The promise, on a night panel: what you say becomes tasks on the phone. */}
      <section className="nv-hero" aria-labelledby="hero-title">
        <div className="nv-hero-glow" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className="nv-hero-grid container">
          <div className="nv-hero-copy">
            <p className="nv-pill">
              <span className="nv-live" aria-hidden="true"></span>
              {frame.comingSoon}
            </p>
            <h1 id="hero-title">
              <Line index={0}>{hero.title}</Line>
              <Line index={1}>
                <em className="nv-accent">{hero.titleAccent}</em>
              </Line>
            </h1>
            <p className="nv-hero-description">{hero.description}</p>
            <div className="nv-hero-buttons">
              <a href="#voice" className="button nv-button-hot">
                {hero.primary} <Icon name="arrow" />
              </a>
              <a href="#features" className="nv-ghost">
                {hero.secondary} <Icon name="chevron" size={16} />
              </a>
            </div>
            <div className="nv-hero-facts">
              <p>{hero.status}</p>
              <p>{hero.free}</p>
            </div>
          </div>
          <div className="nv-hero-art">
            <div className="nv-bubble">
              <span className="nv-bubble-mic" aria-hidden="true">
                <Icon name="mic" size={22} />
              </span>
              <p>{hero.voiceQuote}</p>
              <span className="nv-wave" aria-hidden="true">
                {[10, 18, 26, 14, 30, 20, 11, 22, 8].map((h, i) => (
                  <i key={i} style={{ height: `${h}px` }}></i>
                ))}
              </span>
            </div>
            <p className="nv-toast" aria-hidden="true">
              <span className="nv-chip-check">
                <Icon name="check" size={14} />
              </span>
              {voice.example.heading}
            </p>
            <div className="nv-phone-wrap">
              <span className="nv-ring" aria-hidden="true"></span>
              <NovaPhone language={language} />
            </div>
          </div>
        </div>
      </section>

      {/* 2. A running strip of what it does. */}
      <div className="nv-tapes" aria-hidden="true">
        <div className="nv-marquee nv-marquee-back">
          <div className="nv-marquee-track">
            {[0, 1, 2].map((copyIndex) => (
              <span key={copyIndex}>
                {n.steps.map((step) => (
                  <span key={step.title} className="nv-marquee-item">
                    {step.title}
                    <Icon name="arrow" size={22} />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
        <div className="nv-marquee">
          <div className="nv-marquee-track">
            {[0, 1].map((copyIndex) => (
              <span key={copyIndex}>
                {chapters.map((title) => (
                  <span key={title} className="nv-marquee-item">
                    {title}
                    <Icon name="asterisk" size={22} />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 3. How it works: the north star, in four steps. */}
      <section className="nv-how container" aria-labelledby="how-title">
        <h2 id="how-title" data-reveal>
          <Line>{n.howTitle}</Line>
        </h2>
        <ol className="nv-steps">
          {n.steps.map((step, i) => (
            <li key={step.title} style={order(i)} data-reveal>
              <Num n={i + 1} />
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 4. The live demo, as before. */}
      <VoiceDemo />

      {/* 5. Five chapters. */}
      <section
        id="features"
        className="nv-features container"
        aria-labelledby="features-title"
      >
        <h2 id="features-title" data-reveal>
          <Line>{features.title}</Line>
        </h2>

        <article className="nv-chapter nv-c-voice" data-reveal>
          <div className="nv-chapter-copy">
            <Num n={1} />
            <h3>{features.voice.title}</h3>
            <p>{features.voice.body}</p>
            <a href="#voice" className="nv-link">
              {features.voice.link} <Icon name="arrow" size={17} />
            </a>
          </div>
          <div className="nv-split" aria-hidden="true">
            <p className="nv-split-quote">{voice.example.quote}</p>
            <span className="nv-split-arrow">
              <Icon name="arrow" size={26} />
            </span>
            <ul>
              {voice.example.tasks.map((task) => (
                <li key={task.title}>
                  <span className="nv-chip-check">
                    <Icon name="check" size={14} />
                  </span>
                  <strong>{task.title}</strong>
                  <small>{task.date}</small>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className="nv-chapter nv-c-calendar" data-reveal>
          <div className="nv-chapter-copy">
            <Num n={2} />
            <h3>{features.calendar.title}</h3>
            <p>{features.calendar.body}</p>
          </div>
          <div className="nv-cal" aria-hidden="true">
            <span className="nv-cal-head">{features.calendar.header}</span>
            <div className="nv-cal-week">
              {features.calendar.weekdays.map((weekday, i) => (
                <span key={i} className={i === 0 ? "is-today" : ""}>
                  {weekday}
                  <i></i>
                </span>
              ))}
            </div>
            {features.calendar.events.map((event, i) => (
              <div key={event.title} className={`nv-event nv-event-${i}`}>
                <time>{i === 0 ? "10:00" : "18:00"}</time>
                <div>
                  <strong>{event.title}</strong>
                  <small>{event.detail}</small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="nv-chapter nv-c-meetings" data-reveal>
          <div className="nv-chapter-copy">
            <Num n={3} />
            <span className="nv-pro">Pro</span>
            <h3>{features.meetings.title}</h3>
            <p>{features.meetings.body}</p>
          </div>
          <div className="nv-note" aria-hidden="true">
            <strong className="nv-note-title">
              {features.meetings.note.title}
            </strong>
            <small>{features.meetings.note.header}</small>
            <p>{features.meetings.note.summary}</p>
            <strong className="nv-note-label">
              {features.meetings.note.checklist}
            </strong>
            <ul>
              {features.meetings.note.steps.map((step) => (
                <li key={step}>
                  <span></span>
                  {step}
                </li>
              ))}
            </ul>
            <strong className="nv-note-label">
              {features.meetings.note.decisions}
            </strong>
            <p className="nv-note-decision">{features.meetings.note.decision}</p>
            <span className="nv-note-button">
              {features.meetings.note.button}
            </span>
          </div>
        </article>

        <div className="nv-pair">
          <article className="nv-chapter nv-c-details" data-reveal>
            <Num n={4} />
            <span className="nv-tile-icon" aria-hidden="true">
              <Icon name="notes" size={26} />
            </span>
            <h3>{features.details.title}</h3>
            <p>{features.details.body}</p>
          </article>
          <article
            className="nv-chapter nv-c-offline"
            style={order(1)}
            data-reveal
          >
            <Num n={5} />
            <span className="nv-tile-icon" aria-hidden="true">
              <Icon name="wifiOff" size={26} />
            </span>
            <h3>{features.offline.title}</h3>
            <p>{features.offline.body}</p>
          </article>
        </div>
      </section>

      {/* 6. Free and Pro, side by side. */}
      <section className="nv-plans container" aria-labelledby="plans-title">
        <h2 id="plans-title" data-reveal>
          <Line>{n.plansTitle}</Line>
        </h2>
        <div className="nv-plan-grid">
          <article className="nv-plan" data-reveal>
            <h3>{n.free.name}</h3>
            <ul>
              {n.free.items.map((item) => (
                <li key={item}>
                  <Icon name="check" size={18} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="nv-plan nv-plan-pro" style={order(1)} data-reveal>
            <h3>{n.pro.name}</h3>
            <ul>
              {n.pro.items.map((item) => (
                <li key={item}>
                  <Icon name="check" size={18} />
                  {item}
                </li>
              ))}
            </ul>
            <p>{n.pro.note}</p>
          </article>
        </div>
      </section>

      {/* 7. Questions. */}
      <section
        id="questions"
        className="nv-faq container"
        aria-labelledby="questions-title"
      >
        <div className="nv-faq-intro">
          <h2 id="questions-title" data-reveal>
            <Line>{faq.title}</Line>
          </h2>
          <p>{n.questionsLead}</p>
        </div>
        <div className="nv-faq-list">
          {faq.items.map(({ question, answer }, i) => (
            <details
              key={question}
              className="faq-item nv-q"
              style={order(Math.min(i, 6))}
              data-reveal
            >
              <summary>
                <span className="nv-q-n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="nv-q-text">{question}</span>
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

      {/* 8. A loud close. */}
      <section
        id="get-taskflow"
        className="nv-closing"
        aria-labelledby="closing-title"
      >
        <div className="container nv-closing-inner">
          <h2 id="closing-title">{closing.title}</h2>
          <div className="nv-closing-side">
            <p>{closing.body}</p>
            <a href="#voice" className="button nv-button-night">
              {closing.button} <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
