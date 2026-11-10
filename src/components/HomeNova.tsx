import type { CSSProperties, ReactNode } from "react";
import GarbarMark from "./GarbarMark";
import HowSteps from "./HowSteps";
import Icon from "./Icon";
import Phone from "./Phone";
import StoreBadge from "./StoreBadge";
import VoiceDemo from "./VoiceDemo";
import { copy, type SiteLanguage } from "../content/site";
import {
  family,
  GARBAR_URL,
  LUCID_SAGA_URL,
} from "../content/site/family";
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

// A section's label, as on garbar.tech and Lucid Saga: a ringed number and a few words.
function Kicker({ n, children }: { n?: number; children: ReactNode }) {
  return (
    <p className="nv-kicker" data-reveal>
      <span>{n ? String(n).padStart(2, "0") : <GarbarMark size={14} />}</span>
      {children}
    </p>
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
  const { hero, features, faq, closing, voice } = copy[language];
  const n = nova[language];
  const f = family[language];
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
              {f.eyebrow}
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
              <StoreBadge language={language} />
            </div>
            <p className="nv-hero-langs">{f.languages}</p>
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
              <Phone language={language} className="nv-phone" />
            </div>
          </div>
        </div>
      </section>

      {/* 2. A running strip of what it does, as garbar.tech's and Lucid Saga's. */}
      <div className="nv-marquee nv-tape" aria-hidden="true">
        <div className="nv-marquee-track">
          {[0, 1].map((copyIndex) => (
            <span key={copyIndex}>
              {chapters.map((title) => (
                <span key={title} className="nv-marquee-item">
                  {title}
                  <Icon name="asterisk" size={20} />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* 3. How it works: the four steps beside the app's own screens. */}
      <HowSteps language={language} />

      {/* 4. The live demo, as before. */}
      <VoiceDemo />

      {/* 5. Five chapters. */}
      <section
        id="features"
        className="nv-features container"
        aria-labelledby="features-title"
      >
        <Kicker n={2}>{f.kickers.features}</Kicker>
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
      <section
        id="plans"
        className="nv-plans container"
        aria-labelledby="plans-title"
      >
        <Kicker n={3}>{f.kickers.plans}</Kicker>
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
          <Kicker n={4}>{f.kickers.questions}</Kicker>
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

      {/* 8. A loud close, with the store badge, as Lucid Saga closes. */}
      <section
        id="get-taskflow"
        className="nv-closing"
        aria-labelledby="closing-title"
      >
        <div className="container nv-closing-inner">
          <h2 id="closing-title">{closing.title}</h2>
          <p>{closing.body}</p>
          <div className="nv-closing-buttons">
            <StoreBadge language={language} className="store-badge-night" />
            <a href="#voice" className="button nv-button-night">
              {closing.button} <Icon name="arrow" />
            </a>
          </div>
        </div>
      </section>

      {/* 9. The family: TaskFlow is one of GarBar's two apps (garbar.tech's products). */}
      <section
        className="nv-family container"
        aria-labelledby="family-title"
      >
        <div className="nv-family-intro">
          <Kicker>{f.family.kicker}</Kicker>
          <h2 id="family-title" data-reveal>
            {f.family.title}{" "}
            <em className="nv-accent">{f.family.titleAccent}</em>
          </h2>
          <p data-reveal>{f.family.body}</p>
          <a
            href={`${GARBAR_URL}/${language}/`}
            className="nv-link"
            data-reveal
          >
            {f.family.garbar} <Icon name="arrowUp" size={17} />
          </a>
        </div>
        <a
          href={`${LUCID_SAGA_URL}/${language}`}
          className="nv-sibling"
          data-reveal
        >
          <span className="nv-sibling-art" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/garbar/lucid-saga-gate.webp" alt="" loading="lazy" />
          </span>
          <span className="nv-sibling-copy">
            <small>{f.family.sibling.label}</small>
            <span className="nv-sibling-name">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/garbar/lucid-saga-icon.png"
                alt=""
                width={40}
                height={40}
                loading="lazy"
              />
              {f.family.sibling.name}
            </span>
            <strong>{f.family.sibling.tagline}</strong>
            <span className="nv-sibling-body">{f.family.sibling.body}</span>
            <span className="nv-sibling-link">
              {f.family.sibling.link} <Icon name="arrowUp" size={17} />
            </span>
          </span>
        </a>
      </section>
    </div>
  );
}
