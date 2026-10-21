"use client";

import { usePathname } from "next/navigation";
import {
  LANGUAGE_COOKIE,
  languageNames,
  languages,
  localisePath,
  type SiteLanguage,
} from "../content/site";
import { useSiteLanguage } from "./useSiteLanguage";

// Remembered for the bare address (src/proxy.ts), so a visitor whose browser prefers
// another language can still keep the one they chose.
function remember(language: SiteLanguage) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

// The same page in each language, each name in its own language. Plain links, so the
// switch works without JavaScript; the cookie is written on the way out.
export default function LanguageSwitch({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  const current = useSiteLanguage();
  const pathname = usePathname() ?? "/";
  return (
    <nav
      className={className ? `language-switch ${className}` : "language-switch"}
      aria-label={label}
    >
      {languages.map((language) => (
        <a
          key={language}
          href={localisePath(pathname, language)}
          lang={language}
          hrefLang={language}
          aria-current={language === current ? "page" : undefined}
          onClick={() => remember(language)}
        >
          {languageNames[language]}
        </a>
      ))}
    </nav>
  );
}
