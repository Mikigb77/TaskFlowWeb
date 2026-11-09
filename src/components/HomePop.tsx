import type { CSSProperties, ReactNode } from "react";
import Icon from "./Icon";
import VoiceDemo from "./VoiceDemo";
import { copy, type SiteLanguage } from "../content/site";
import { explore } from "../content/site/explore";
import { nova } from "../content/site/nova";

// Exploration: "Pop". Loud and playful: electric blue, hot pink, lime and black, one huge
// button in the middle of the page, stickers, a spinning badge and big numbers.

const order = (i: number) => ({ "--i": i }) as CSSProperties;

function Line({ children, index = 0 }: { children: ReactNode; index?: number }) {
  return (
    <span className="line" style={order(index)}>
      <span>{children}</span>
    </span>
  );
}

// Text running round a circle, turning slowly.
function SpinBadge({ text }: { text: string }) {
  const label = `${text} ✱ ${text} ✱ `;
  return (
    <svg className="pp-badge" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <path
          id="pp-circle"
          d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
        />
      </defs>
      <circle cx="100" cy="100" r="100" />
      <text>
        <textPath href="#pp-circle" textLength="488">
          {label}
        </textPath>
      </text>
    </svg>
  );
}

export default function HomePop({ language }: { language: SiteLanguage }) {
  const { hero, features, faq, closing, voice } = copy[language];
  const n = nova[language];
  const p = explore[language].pop;
  const cards = [
    { cls: "pp-card-pink", icon: "mic", ...features.voice },
    { cls: "pp-card-lime", icon: "calendar", ...features.calendar },
    { cls: "pp-card-black", icon: "people", ...features.meetings, pro: true },
    { cls: "pp-card-blue", icon: "notes", ...features.details },
    { cls: "pp-card-white", icon: "wifiOff", ...features.offline },
  ];
  return (
    <div lang={language} className="pop">
      {/* 1. One big button. */}
      <section className="pp-hero" aria-labelledby="hero-title">
        <div className="container pp-hero-inner">
          <h1 id="hero-title">
            <Line index={0}>{hero.title}</Line>
            <Line index={1}>
              <span className="pp-scribble">{hero.titleAccent}</span>
            </Line>
          </h1>

          <div className="pp-stage">
            <a href="#voice" className="pp-mic" aria-label={hero.primary}>
              <span className="pp-pulse" aria-hidden="true"></span>
              <span className="pp-pulse pp-pulse-2" aria-hidden="true"></span>
              <Icon name="mic" size={64} />
            </a>
            <p className="pp-sticker pp-s-quote" aria-hidden="true">
              {hero.voiceQuote}
            </p>
            {voice.example.tasks.map((task, i) => (
              <p
                key={task.title}
                className={`pp-sticker pp-s-task pp-s-task-${i}`}
                aria-hidden="true"
              >
                <Icon name="check" size={18} /> {task.title}
                <small>{task.date}</small>
              </p>
            ))}
            <SpinBadge text={p.sticker} />
          </div>

          <div className="pp-hero-foot">
            <p>{hero.description}</p>
            <div className="pp-hero-cta">
              <a href="#voice" className="button pp-button">
                {hero.primary} <Icon name="arrow" />
              </a>
              <p className="pp-fine">
                {hero.status} {hero.free}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. In and out. */}
      <section className="pp-io container" aria-labelledby="io-title">
        <h2 id="io-title" data-reveal>
          <Line>{p.inOut}</Line>
        </h2>
        <div className="pp-io-grid">
          <div className="pp-io-in" data-reveal>
            <span className="pp-label">{p.inLabel}</span>
            <p>{voice.example.quote}</p>
            <span className="pp-bars" aria-hidden="true">
              {[14, 30, 22, 40, 18, 34, 12, 26, 38, 16, 28, 20].map((h, i) => (
                <i key={i} style={{ height: h, ...order(i) }}></i>
              ))}
            </span>
          </div>
          <span className="pp-io-arrow" aria-hidden="true">
            <Icon name="arrow" size={40} />
          </span>
          <div className="pp-io-out" style={order(1)} data-reveal>
            <span className="pp-label">{p.outLabel}</span>
            {voice.example.tasks.map((task) => (
              <p key={task.title}>
                <span className="pp-tick">
                  <Icon name="check" size={16} />
                </span>
                {task.title}
                <small>{task.date}</small>
              </p>
            ))}
          </div>
        </div>
        <ol className="pp-steps">
          {n.steps.map((step, i) => (
            <li key={step.title} style={order(i)} data-reveal>
              <span aria-hidden="true">{i + 1}</span>
              <strong>{step.title}</strong> {step.body}
            </li>
          ))}
        </ol>
      </section>

      {/* 3. The demo */}
      <VoiceDemo />

      {/* 4. Sticker cards */}
      <section
        id="features"
        className="pp-features"
        aria-labelledby="features-title"
      >
        <div className="container pp-features-head">
          <h2 id="features-title" data-reveal>
            <Line>{features.title}</Line>
          </h2>
          <span className="pp-hint" aria-hidden="true">
            {p.scrollHint} <Icon name="arrow" size={18} />
          </span>
        </div>
        <div className="pp-rail">
          {cards.map((card, i) => (
            <article
              key={card.title}
              className={`pp-card ${card.cls}`}
              style={order(i)}
              data-reveal
            >
              <span className="pp-card-icon" aria-hidden="true">
                <Icon name={card.icon} size={30} />
              </span>
              {"pro" in card && <span className="pp-pro">Pro</span>}
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* 5. Big numbers */}
      <section className="pp-numbers" aria-labelledby="numbers-title">
        <div className="container">
          <h2 id="numbers-title" className="pp-small-title">
            {p.numbersTitle}
          </h2>
          <dl>
            {p.numbers.map((item, i) => (
              <div key={item.label} style={order(i)} data-reveal>
                <dt>{item.value}</dt>
                <dd>{item.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 6. Plans and questions, on black */}
      <section className="pp-dark" aria-labelledby="plans-title">
        <div className="container">
          <h2 id="plans-title" data-reveal>
            <Line>{n.plansTitle}</Line>
          </h2>
          <div className="pp-plans">
            <article className="pp-plan" data-reveal>
              <h3>{n.free.name}</h3>
              <ul>
                {n.free.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
            <article className="pp-plan pp-plan-pro" style={order(1)} data-reveal>
              <h3>{n.pro.name}</h3>
              <ul>
                {n.pro.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p>{n.pro.note}</p>
            </article>
          </div>
        </div>
      </section>

      <section
        id="questions"
        className="pp-faq container"
        aria-labelledby="questions-title"
      >
        <h2 id="questions-title" data-reveal>
          <Line>{faq.title}</Line>
        </h2>
        <div className="pp-faq-list">
          {faq.items.map(({ question, answer }, i) => (
            <details key={question} className="faq-item pp-q" style={order(Math.min(i, 6))} data-reveal>
              <summary>
                {question}
                <span className="faq-plus">
                  <Icon name="plus" size={20} />
                </span>
              </summary>
              {[answer].flat().map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </details>
          ))}
        </div>
      </section>

      {/* 7. Close */}
      <section
        id="get-taskflow"
        className="pp-closing"
        aria-labelledby="closing-title"
      >
        <div className="pp-closing-marquee" aria-hidden="true">
          <div>
            {[0, 1, 2, 3].map((i) => (
              <span key={i}>
                {closing.title} <Icon name="asterisk" size={48} />
              </span>
            ))}
          </div>
        </div>
        <div className="container pp-closing-inner">
          <h2 id="closing-title">{closing.title}</h2>
          <p>{closing.body}</p>
          <a href="#voice" className="button pp-button-black">
            {closing.button} <Icon name="arrow" />
          </a>
        </div>
      </section>
    </div>
  );
}
