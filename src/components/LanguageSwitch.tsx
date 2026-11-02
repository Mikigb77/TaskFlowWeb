"use client";

import { usePathname } from "next/navigation";
import {
  followsVisitor,
  LANGUAGE_COOKIE,
  languageNames,
  languages,
  localisePath,
  type SiteLanguage,
} from "../content/site";
import { useSiteLanguage } from "./useSiteLanguage";

// Remembered for the addresses that follow the visitor (src/proxy.ts), so a visitor whose
// browser prefers another language can still keep the one they chose.
function remember(language: SiteLanguage) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

// The bare address and /delete-account/ redirect by the visitor's language (src/proxy.ts),
// so their links carry the choice, which the server remembers before any JavaScript has
// run. WEB-1603, WEB-1508.
function target(pathname: string, language: SiteLanguage) {
  const path = localisePath(pathname, language);
  return followsVisitor.includes(path) ? `${path}?lang=${language}` : path;
}

// The same page in each language, each name in its own language. Plain links, so the
// switch works without JavaScript; the cookie is written on the way out. The footer's
// copy is a group, so each page has one ‘Language’ landmark. WEB-1606.
export default function LanguageSwitch({
  label,
  className,
  as = "nav",
}: {
  label: string;
  className?: string;
  as?: "nav" | "group";
}) {
  const current = useSiteLanguage();
  const pathname = usePathname() ?? "/";
  const classes = className
    ? `language-switch ${className}`
    : "language-switch";
  const links = languages.map((language) => (
    <a
      key={language}
      href={target(pathname, language)}
      lang={language}
      hrefLang={language}
      aria-current={language === current ? "page" : undefined}
      onClick={() => remember(language)}
    >
      {languageNames[language]}
    </a>
  ));
  return as === "group" ? (
    <div className={classes} role="group" aria-label={label}>
      {links}
    </div>
  ) : (
    <nav className={classes} aria-label={label}>
      {links}
    </nav>
  );
}
