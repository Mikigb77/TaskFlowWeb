"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SiteLanguage } from "../content/site";
import { family } from "../content/site/family";
import { nova } from "../content/site/nova";

// The four steps, each beside the app's own screen for it, rendered from the real app
// (../TaskFlow/App/test/ux_previews/website_previews.dart): Calendar before, listening, the two
// things to add, and tomorrow with them. On wide screens one phone stays in view and shows the
// step being read; on narrow ones the four screens follow the steps, in a row to swipe.
const screen = (step: number, language: SiteLanguage, theme: string) =>
  step === 3
    ? `/images/hero-calendar-${language}-${theme}.png`
    : `/images/step-${step + 1}-${language}-${theme}.webp`;

function Shots({
  step,
  language,
  sizes,
}: {
  step: number;
  language: SiteLanguage;
  sizes: string;
}) {
  const alt = family[language].screens[step];
  return (
    <>
      {(["light", "dark"] as const).map((theme) => (
        <Image
          key={theme}
          className={`${theme}-only`}
          src={screen(step, language, theme)}
          width={780}
          height={1688}
          sizes={sizes}
          alt={alt}
        />
      ))}
    </>
  );
}

export default function HowSteps({ language }: { language: SiteLanguage }) {
  const { steps, howTitle } = nova[language];
  const kicker = family[language].kickers.how;
  const [active, setActive] = useState(0);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    items.current.forEach((item) => item && observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return (
    <section id="how" className="nv-how container" aria-labelledby="how-title">
      <div className="nv-how-stage" aria-hidden="true">
        <div className="nv-how-phone">
          <span className="nv-how-camera"></span>
          {steps.map((step, i) => (
            <div
              key={step.title}
              className={`nv-how-screen${i === active ? " is-on" : ""}`}
            >
              <Shots step={i} language={language} sizes="320px" />
            </div>
          ))}
        </div>
      </div>
      <div className="nv-how-copy">
        <p className="nv-kicker" data-reveal>
          <span>01</span>
          {kicker}
        </p>
        <h2 id="how-title" data-reveal>
          {howTitle}
        </h2>
        <ol className="nv-timeline">
          {steps.map((step, i) => (
            <li
              key={step.title}
              ref={(item) => {
                items.current[i] = item;
              }}
              data-step={i}
              className={i === active ? "is-on" : ""}
            >
              <span className="nv-timeline-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
        {/* On narrow screens: the four screens in a row to swipe through. */}
        <div className="nv-how-strip">
          {steps.map((step, i) => (
            <figure key={step.title}>
              <div className="nv-step-shot">
                <Shots step={i} language={language} sizes="200px" />
              </div>
              <figcaption>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {step.title}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
