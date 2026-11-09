import type { CSSProperties, ReactNode } from "react";
import Icon from "./Icon";
import Phone from "./Phone";
import VoiceDemo from "./VoiceDemo";
import { copy, type SiteLanguage } from "../content/site";

// A stagger index for an entrance, read by global.css as --i.
const order = (i: number) => ({ "--i": i }) as CSSProperties;

// A line of a heading that slides up from behind a mask when it first appears.
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

// Slow colour drifting behind a dark card, as on garbar.tech, in TaskFlow's greens.
function Aurora() {
  return (
    <div className="aurora" aria-hidden="true">
      <span className="blob blob-a"></span>
      <span className="blob blob-b"></span>
      <span className="blob blob-c"></span>
    </div>
  );
}

export default function HomePage({ language }: { language: SiteLanguage }) {
  const { hero, features, faq, closing } = copy[language];
  return (
    <div lang={language}>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            <Line index={0}>{hero.title}</Line>
            <Line index={1}>
              <span className="hero-accent">{hero.titleAccent}</span>
            </Line>
          </h1>
          <p className="hero-description">{hero.description}</p>
          <div className="hero-buttons">
            <a href="#voice" className="button">
              {hero.primary} <Icon name="arrow" />
            </a>
            <a href="#features" className="text-link">
              {hero.secondary}{" "}
              <span className="link-circle">
                <Icon name="chevron" size={15} />
              </span>
            </a>
          </div>
          <p className="hero-status">{hero.status}</p>
          <p className="hero-free">{hero.free}</p>
        </div>
        <div className="hero-art" data-pointer>
          <div className="hero-stage" aria-hidden="true">
            <span className="orbit orbit-one"></span>
            <span className="orbit orbit-two"></span>
            <span className="stage-cross">+</span>
            <span className="stage-dot"></span>
          </div>
          <div className="floating-note">
            <span className="note-icon" aria-hidden="true">
              <Icon name="mic" size={20} />
            </span>
            <p>{hero.voiceQuote}</p>
            <div className="mini-wave" aria-hidden="true">
              {[8, 16, 23, 12, 29, 18, 9].map((height) => (
                <i key={height} style={{ height: `${height}px` }}></i>
              ))}
            </div>
          </div>
          <Phone language={language} className="hero-phone" />
        </div>
      </section>

      <VoiceDemo />

      <section
        id="features"
        className="features-section section-space container"
        aria-labelledby="features-title"
      >
        <h2 id="features-title" data-reveal>
          <Line>{features.title}</Line>
        </h2>
        <div className="feature-grid">
          <article
            className="feature-calendar feature-card"
            style={order(0)}
            data-reveal
            data-pointer
          >
            <div className="feature-card-copy">
              <span className="feature-icon">
                <Icon name="calendar" size={23} />
              </span>
              <h3>{features.calendar.title}</h3>
              <p>{features.calendar.body}</p>
            </div>
            <div className="calendar-illustration" aria-hidden="true">
              <div className="calendar-mini-header">
                <span>{features.calendar.header}</span>
              </div>
              <div className="mini-week">
                {features.calendar.weekdays.map((weekday, i) => (
                  <div
                    key={i}
                    className={`mini-day ${i === 0 ? "selected" : ""}`}
                  >
                    <span>{weekday}</span>
                    <i></i>
                  </div>
                ))}
              </div>
              <div className="mini-event">
                <span className="event-time">10:00</span>
                <span className="event-line"></span>
                <div>
                  <strong>{features.calendar.events[0].title}</strong>
                  <small>{features.calendar.events[0].detail}</small>
                </div>
                <span className="event-dot"></span>
              </div>
              <div className="mini-event event-secondary">
                <span className="event-time">18:00</span>
                <span className="event-line"></span>
                <div>
                  <strong>{features.calendar.events[1].title}</strong>
                  <small>{features.calendar.events[1].detail}</small>
                </div>
                <Icon name="leaf" size={19} />
              </div>
            </div>
          </article>
          <article
            className="feature-voice feature-card"
            style={order(1)}
            data-reveal
            data-pointer
          >
            <div className="feature-card-copy">
              <span className="feature-icon">
                <Icon name="mic" size={23} />
              </span>
              <h3>{features.voice.title}</h3>
              <p>{features.voice.body}</p>
              <a href="#voice" className="inline-link">
                {features.voice.link} <Icon name="arrow" size={17} />
              </a>
            </div>
          </article>
          <article
            className="feature-details feature-card"
            style={order(2)}
            data-reveal
            data-pointer
          >
            <span className="feature-icon">
              <Icon name="notes" size={23} />
            </span>
            <h3>{features.details.title}</h3>
            <p>{features.details.body}</p>
          </article>
          <article
            className="feature-meetings feature-card"
            style={order(0)}
            data-reveal
            data-pointer
          >
            <div className="feature-card-copy">
              <span className="feature-icon">
                <Icon name="people" size={23} />
              </span>
              <h3>{features.meetings.title}</h3>
              <p>{features.meetings.body}</p>
            </div>
            <div className="meeting-illustration" aria-hidden="true">
              <strong className="meeting-note-title">
                {features.meetings.note.title}
              </strong>
              <strong className="meeting-note-label meeting-checklist-label">
                {features.meetings.note.checklist}
              </strong>
              <ul>
                {features.meetings.note.steps.map((step) => (
                  <li key={step}>
                    <span className="meeting-box"></span>
                    {step}
                  </li>
                ))}
              </ul>
              <small>{features.meetings.note.header}</small>
              <span className="meeting-line">
                {features.meetings.note.summary}
              </span>
              <strong className="meeting-note-label">
                {features.meetings.note.decisions}
              </strong>
              <span className="meeting-line meeting-decision">
                {features.meetings.note.decision}
              </span>
              <span className="meeting-button">
                {features.meetings.note.button}
              </span>
            </div>
          </article>
          <article
            className="feature-offline feature-card"
            style={order(0)}
            data-reveal
            data-pointer
          >
            <span className="feature-icon">
              <Icon name="wifiOff" size={23} />
            </span>
            <h3>{features.offline.title}</h3>
            <p>{features.offline.body}</p>
          </article>
        </div>
      </section>

      <section
        id="questions"
        className="faq-section section-space container"
        aria-labelledby="questions-title"
      >
        <div className="faq-intro">
          <h2 id="questions-title" data-reveal>
            <Line>{faq.title}</Line>
          </h2>
        </div>
        <div className="faq-list">
          {faq.items.map(({ question, answer }, i) => (
            <details
              key={question}
              className="faq-item"
              style={order(Math.min(i, 6))}
              data-reveal
            >
              <summary>
                {question}
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

      <section
        id="get-taskflow"
        className="closing-section container"
        aria-labelledby="closing-title"
      >
        <div className="closing-card" data-reveal data-pointer>
          <Aurora />
          <div className="closing-spark" aria-hidden="true">
            <Icon name="asterisk" size={44} />
          </div>
          <h2 id="closing-title">{closing.title}</h2>
          <p>{closing.body}</p>
          <a href="#voice" className="button button-lime">
            {closing.button} <Icon name="arrow" />
          </a>
          <p className="closing-plans">{closing.plans}</p>
          <div className="closing-orbit" aria-hidden="true"></div>
        </div>
      </section>
    </div>
  );
}
