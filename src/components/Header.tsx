"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import LanguageSwitch from "./LanguageSwitch";
import { AppearanceChoice, ThemeToggle } from "./ThemeProvider";
import { useSiteLanguage } from "./useSiteLanguage";
import { copy, homePath } from "../content/site";

export default function Header() {
  const language = useSiteLanguage();
  const { frame } = copy[language];
  const home = homePath(language);
  const links = [
    [frame.voice, `${home}#voice`],
    [frame.features, `${home}#features`],
    [frame.questions, `${home}#questions`],
  ];
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    const outside = (event: PointerEvent) => {
      if (menu.current?.open && !menu.current.contains(event.target as Node))
        menu.current.open = false;
    };
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", outside);
    return () => {
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
          <LanguageSwitch className="header-languages" label={frame.language} />
          <ThemeToggle />
          <details className="header-menu" ref={menu}>
            <summary>
              <Icon name="menu" size={20} />
              <span>{frame.menu}</span>
            </summary>
            <div className="header-menu-panel">
              <LanguageSwitch
                className="menu-languages"
                label={frame.language}
              />
              <nav aria-label={frame.navigation}>
                {links.map(([label, href]) => (
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
