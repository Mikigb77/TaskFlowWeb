"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { SiteLanguage } from "../content/site";
import { family } from "../content/site/family";
import { nova } from "../content/site/nova";

// The four steps, each beside the app's own screen for it, rendered from the real app
// (../TaskFlow/App/test/ux_previews/website_previews.dart): Calendar before, listening, the two
// things to add, and tomorrow with them. On narrow or short screens each screen sits under
// its own step, and the line joining the steps draws itself as the page scrolls.
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

// On wide, tall screens the section pins in place: the page stops scrolling past it, and
// the next stretch of scroll rolls the steps, one at a time, with the phone's screen beside
// them. Each step gets its own stretch (--how-step in family.css), so none flashes by.
const PINNED = "(min-width: 801px) and (min-height: 600px)";

export default function HowSteps({ language }: { language: SiteLanguage }) {
  const { steps, howTitle } = nova[language];
  const kicker = family[language].kickers.how;
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    const element = section.current;
    if (!element) return;
    const media = window.matchMedia(PINNED);
    let frame = 0;
    // Narrow or short screens: a step is reached once its number passes 60% of the way down
    // the screen, and the line below it fills as the page scrolls on to the next number.
    const draw = () => {
      const items = list.current?.children;
      if (!items) return;
      const pen = window.innerHeight * 0.6;
      list.current?.classList.add("is-drawing");
      Array.from(items).forEach((item, i) => {
        const box = item.getBoundingClientRect();
        const number = item.firstElementChild?.getBoundingClientRect().height ?? 44;
        const reached = pen >= box.top + number / 2;
        if (reached) (item as HTMLElement).dataset.reached = "";
        else delete (item as HTMLElement).dataset.reached;
        const next = items[i + 1]?.getBoundingClientRect().top ?? box.bottom;
        const span = next - box.top - number;
        const fill = span > 0 ? (pen - box.top - number) / span : 0;
        (item as HTMLElement).style.setProperty("--fill", String(Math.min(Math.max(fill, 0), 1)));
      });
    };
    const update = () => {
      frame = 0;
      if (!media.matches) {
        draw();
        return;
      }
      const box = element.getBoundingClientRect();
      const travel = box.height - window.innerHeight;
      const progress = travel > 0 ? Math.min(Math.max(-box.top / travel, 0), 1) : 0;
      const position = progress * steps.length;
      setActive(Math.min(steps.length - 1, Math.floor(position)));
      rail.current?.querySelectorAll<HTMLElement>("span").forEach((segment, i) => {
        segment.style.setProperty("--fill", String(Math.min(Math.max(position - i, 0), 1)));
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    media.addEventListener("change", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      media.removeEventListener("change", schedule);
    };
  }, [steps.length]);
  const place = (i: number) => (i === active ? " is-on" : i < active ? " is-past" : "");
  return (
    <section
      id="how"
      ref={section}
      className="nv-how"
      aria-labelledby="how-title"
      style={{ "--how-steps": steps.length } as CSSProperties}
    >
      <div className="nv-how-pin container">
        <div className="nv-how-stage" aria-hidden="true">
          <div className="nv-how-phone">
            <span className="nv-how-camera"></span>
            {steps.map((step, i) => (
              <div key={step.title} className={`nv-how-screen${place(i)}`}>
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
          <div className="nv-how-rail" ref={rail} aria-hidden="true">
            {steps.map((step) => (
              <span key={step.title}></span>
            ))}
          </div>
          <ol className="nv-timeline" ref={list}>
            {steps.map((step, i) => (
              <li key={step.title} className={place(i).trim()}>
                <span className="nv-timeline-n" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  {/* Narrow or short screens: the step's own screen, under its words. */}
                  <div className="nv-step-shot">
                    <Shots step={i} language={language} sizes="250px" />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
