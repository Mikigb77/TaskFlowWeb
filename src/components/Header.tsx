"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";
import { AppearanceChoice, ThemeToggle } from "./ThemeProvider";
import { useSiteLanguage } from "./useSiteLanguage";
import { copy, homePath } from "../content/site";
import { family } from "../content/site/family";

// The part of CloseWatcher the menu uses, declared here since TypeScript's DOM types may lack it.
type CloseWatcherLike = { onclose: (() => void) | null; destroy(): void };

export default function Header() {
  const language = useSiteLanguage();
  const { frame } = copy[language];
  const { nav } = family[language];
  const home = homePath(language);
  // GarBar's product pages share one header: the app, its sections, the languages and one call
  // to action (lucidsaga.garbar.tech, garbar.tech).
  const links = [
    [nav.how, `${home}#how`],
    [frame.features, `${home}#features`],
    [nav.plans, `${home}#plans`],
    [frame.questions, `${home}#questions`],
  ];
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const details = menu.current;
    if (!details) return;
    // Android's Back (and other close requests) close the open menu where the browser has CloseWatcher.
    const Watcher = (
      window as Window & { CloseWatcher?: new () => CloseWatcherLike }
    ).CloseWatcher;
    let watcher: CloseWatcherLike | null = null;
    const stopWatching = () => {
      watcher?.destroy();
      watcher = null;
    };
    // Closes the menu; focus goes back to its button only if it was inside the menu.
    const shut = () => {
      stopWatching();
      const inside = details.contains(document.activeElement);
      details.open = false;
      if (inside) details.querySelector("summary")?.focus();
    };
    const toggle = () => {
      if (!details.open) stopWatching();
      else if (Watcher && !watcher) {
        watcher = new Watcher();
        watcher.onclose = shut;
      }
    };
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && details.open) shut();
    };
    const outside = (event: PointerEvent) => {
      if (details.open && !details.contains(event.target as Node))
        details.open = false;
    };
    // Tab past the last control closes the menu. A null relatedTarget (Safari, on a tap that
    // doesn't move focus) is ignored, so a tap on Dark isn't swallowed.
    const leave = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (details.open && next instanceof Node && !details.contains(next))
        details.open = false;
    };
    details.addEventListener("toggle", toggle);
    details.addEventListener("focusout", leave);
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
      stopWatching();
      details.removeEventListener("toggle", toggle);
      details.removeEventListener("focusout", leave);
      document.removeEventListener("keydown", close);
      document.removeEventListener("pointerdown", outside);
    };
  }, []);
  const closeMenu = () => {
    if (menu.current) menu.current.open = false;
  };
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href={home} className="brand" aria-label={frame.home}>
          <span className="brand-mark">
            <Icon name="logo" size={23} />
          </span>
          <span>
            taskflow<span className="brand-period">.</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label={frame.navigation}>
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <LanguageSwitch
            className="header-languages"
            label={frame.language}
            short
          />
          <ThemeToggle />
          <a href={`${home}#voice`} className="header-cta">
            <span className="header-cta-dot" aria-hidden="true"></span>
            {nav.cta}
          </a>
          <details className="header-menu" ref={menu}>
            <summary>
              <Icon name="menu" size={20} className="menu-icon" />
              <Icon name="close" size={20} className="close-icon" />
              <span>{frame.menu}</span>
            </summary>
            <div className="header-menu-panel">
              <LanguageSwitch
                className="menu-languages"
                label={frame.language}
              />
              <nav aria-label={frame.navigation}>
                {[[frame.voice, `${home}#voice`], ...links].map(([label, href]) => (
                  <a key={href} href={href} onClick={closeMenu}>
                    {label} <Icon name="arrow" size={18} />
                  </a>
                ))}
                <a href={`${home}#get-taskflow`} onClick={closeMenu}>
                  {frame.comingSoon} <Icon name="arrow" size={18} />
                </a>
              </nav>
              <AppearanceChoice />
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
