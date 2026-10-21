"use client";

import { useEffect } from "react";
import Icon from "./Icon";
import { useSiteLanguage } from "./useSiteLanguage";
import { copy, homePath, languages } from "../content/site";

// The 404 in all three languages. It is prerendered once, in English first; after
// hydration the address's language (/es/…, /ca/…) moves to the top as the h1. Until
// then, not-found.tsx's script has put that block first with CSS `order`, so the
// reorder doesn't move anything on screen. The effect keeps that mark right when the page
// is reached without a full load.
export default function NotFoundPage() {
  const current = useSiteLanguage();
  const order = [current, ...languages.filter((code) => code !== current)];
  useEffect(() => {
    document.documentElement.dataset.notFound = current;
  }, [current]);
  return (
    <section className="not-found container">
      {order.map((language, index) => {
        const text = copy[language].notFound;
        const Heading = index === 0 ? "h1" : "h2";
        return (
          <div key={language} lang={language} className="not-found-block">
            <Heading>{text.title}</Heading>
            <p>{text.body}</p>
            <div className="not-found-links">
              <a className="text-link" href={homePath(language)}>
                {text.home} <Icon name="arrow" />
              </a>
              <a
                className="text-link"
                href={`${homePath(language)}delete-account/`}
              >
                {text.deleteAccount} <Icon name="arrow" />
              </a>
            </div>
          </div>
        );
      })}
    </section>
  );
}
