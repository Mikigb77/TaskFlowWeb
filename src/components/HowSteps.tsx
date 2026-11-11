"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { SiteLanguage } from "../content/site";
import { family } from "../content/site/family";
import { nova } from "../content/site/nova";

// The four steps, each with the app's own screen for it, rendered from the real app
// (../TaskFlow/App/test/ux_previews/website_previews.dart): Calendar before, listening, the two
// things to add, and tomorrow with them. The steps run down the page, the line joining their
// numbers draws itself as the page scrolls, and each screen slides in as the line reaches its
// step. On phones each screen sits under its words; on wider screens beside them, sized so the
// whole screen fits in the window.
const screen = (step: number, language: SiteLanguage, theme: string) =>
  step === 3
    ? `/images/hero-calendar-${language}-${theme}.png`
    : `/images/step-${step + 1}-${language}-${theme}.webp`;

function Shots({ step, language }: { step: number; language: SiteLanguage }) {
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
          sizes="(max-width: 860px) 250px, 320px"
          alt={alt}
        />
      ))}
    </>
  );
}

export default function HowSteps({ language }: { language: SiteLanguage }) {
  const { steps, howTitle } = nova[language];
  const kicker = family[language].kickers.how;
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const element = list.current;
    if (!element) return;
    let frame = 0;
    // A step is reached once the middle of its number passes 60% of the way down the window
    // (70% on wider screens, where the number sits mid-row beside its screen), and the line
    // below it fills as the page scrolls on to the next number.
    const wide = window.matchMedia("(min-width: 861px) and (min-height: 600px)");
    const draw = () => {
      frame = 0;
      const pen = window.innerHeight * (wide.matches ? 0.7 : 0.6);
      const numbers = Array.from(element.querySelectorAll<HTMLElement>(".nv-timeline-n"));
      numbers.forEach((number, i) => {
        const item = number.parentElement as HTMLElement;
        const box = number.getBoundingClientRect();
        if (pen >= box.top + box.height / 2) item.dataset.reached = "";
        else delete item.dataset.reached;
        const next = numbers[i + 1]?.getBoundingClientRect().top;
        const span = next === undefined ? 0 : next - box.bottom;
        const fill = span > 0 ? (pen - box.bottom) / span : 0;
        item.style.setProperty("--fill", String(Math.min(Math.max(fill, 0), 1)));
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    element.classList.add("is-drawing");
    draw();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  return (
    <section id="how" className="nv-how" aria-labelledby="how-title">
      <div className="container">
        <p className="nv-kicker" data-reveal>
          <span>01</span>
          {kicker}
        </p>
        <h2 id="how-title" data-reveal>
          {howTitle}
        </h2>
        <ol className="nv-timeline" ref={list}>
          {steps.map((step, i) => (
            <li key={step.title}>
              <span className="nv-timeline-n" aria-hidden="true">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="nv-step-text">
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
              <div className="nv-step-shot">
                <Shots step={i} language={language} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
