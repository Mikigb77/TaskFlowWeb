"use client";

import { useEffect, useRef } from "react";
import Icon from "./Icon";
import { ThemeToggle } from "./ThemeProvider";

const links = [
  ["Features", "/#features"],
  ["Try voice", "/#voice"],
  ["Questions", "/#questions"],
];
export default function Header() {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && menu.current?.open) {
        menu.current.open = false;
        menu.current.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, []);
  const closeMenu = () => {
    if (menu.current) menu.current.open = false;
  };
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="/" className="brand" aria-label="TaskFlow home">
          <span className="brand-mark">
            <Icon name="logo" size={23} />
          </span>
          <span>
            taskflow<span className="brand-period">.</span>
          </span>
        </a>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          <a className="button button-small header-cta" href="/#voice">
            Explore the app <Icon name="arrowUp" size={17} />
          </a>
          <details className="header-menu" ref={menu}>
            <summary aria-label="Open navigation">
              <span></span>
              <span></span>
            </summary>
            <nav aria-label="Mobile navigation">
              {links.map(([label, href]) => (
                <a key={href} href={href} onClick={closeMenu}>
                  {label} <Icon name="arrow" size={18} />
                </a>
              ))}
              <a href="/#get-taskflow" onClick={closeMenu}>
                Get TaskFlow <Icon name="arrow" size={18} />
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
