import { Fragment } from "react";
import Icon from "./Icon";
import Phone from "./Phone";
import VoiceDemo from "./VoiceDemo";
import { copy, type SiteLanguage } from "../content/site";

const lines = (text: string[]) =>
  text.map((line, index) => (
    <Fragment key={index}>
      {index > 0 && <br />}
      {line}
    </Fragment>
  ));

export default function HomePage({ language }: { language: SiteLanguage }) {
  const { hero, features, faq, closing } = copy[language];
  return (
    <div lang={language}>
      <section className="hero container" aria-labelledby="hero-title">
        <div className="hero-copy">
          <h1 id="hero-title">
            {hero.title}
            <span className="hero-accent">{hero.titleAccent}</span>
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
        </div>
        <div className="hero-art">
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

      {/* The demo is English until WP26–WP29 translate it; then remove this wrapper. */}
      <div lang="en" style={{ display: "contents" }}>
        <VoiceDemo />
      </div>

      <section
        id="features"
        className="features-section section-space container"
        aria-labelledby="features-title"
      >
        <h2 id="features-title">{features.title}</h2>
        <div className="feature-grid">
          <article className="feature-calendar feature-card">
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
          <article className="feature-voice feature-card">
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
          <article className="feature-details feature-card">
            <span className="feature-icon">
              <Icon name="notes" size={23} />
            </span>
            <h3>{features.details.title}</h3>
            <p>{features.details.body}</p>
          </article>
          <article className="feature-offline feature-card">
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
          <p className="eyebrow section-eyebrow">
            <span>04 /</span> {faq.eyebrow}
          </p>
          <h2 id="questions-title">{faq.title}</h2>
          <p>{lines(faq.intro)}</p>
          <div className="faq-doodle" aria-hidden="true">
            <Icon name="spark" size={56} />
            <span>{lines(faq.doodle)}</span>
          </div>
        </div>
        <div className="faq-list">
          {faq.items.map(({ question, answer }) => (
            <details key={question} className="faq-item">
              <summary>
                {question}
                <span className="faq-plus">
                  <Icon name="plus" size={18} />
                </span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        id="get-taskflow"
        className="closing-section container"
        aria-labelledby="closing-title"
      >
        <div className="closing-card">
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
