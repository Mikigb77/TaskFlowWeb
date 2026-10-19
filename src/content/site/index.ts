import type { Metadata } from "next";
import { ca } from "./ca";
import { en } from "./en";
import { es } from "./es";
import type { SiteCopy, SiteLanguage } from "./types";

export type { SiteCopy, SiteLanguage };

export const languages: readonly SiteLanguage[] = ["en", "es", "ca"];
export const copy: Record<SiteLanguage, SiteCopy> = { en, es, ca };
export const languageNames: Record<SiteLanguage, string> = {
  en: "English",
  es: "Español",
  ca: "Català",
};
// The language switch writes this cookie; src/proxy.ts reads it on the bare address.
export const LANGUAGE_COOKIE = "taskflow-lang";

// Pages the site has in all three languages, besides the home.
const translatedPages = ["privacy", "terms", "legal", "delete-account"];

export function isSiteLanguage(value: unknown): value is SiteLanguage {
  return languages.includes(value as SiteLanguage);
}

export function homePath(language: SiteLanguage) {
  return language === "en" ? "/" : `/${language}/`;
}

// The home's canonical and hreflang links, only when the build knows the site's address.
export function homeAlternates(language: SiteLanguage) {
  return process.env.SITE_URL
    ? {
        canonical: homePath(language),
        languages: {
          ...Object.fromEntries(
            languages.map((code) => [code, homePath(code)]),
          ),
          "x-default": homePath("en"),
        },
      }
    : undefined;
}

// Open Graph locales, for link previews.
const locales: Record<SiteLanguage, string> = {
  en: "en_US",
  es: "es_ES",
  ca: "ca_ES",
};

// The home's title, description and link preview in one language. The preview image
// comes from the opengraph-image file next to the home's page file.
export function homeMetadata(language: SiteLanguage): Metadata {
  const { title, description } = copy[language].meta;
  return {
    title,
    description,
    alternates: homeAlternates(language),
    openGraph: {
      type: "website",
      siteName: "TaskFlow",
      title,
      description,
      ...(process.env.SITE_URL ? { url: homePath(language) } : {}),
      locale: locales[language],
      alternateLocale: languages
        .filter((code) => code !== language)
        .map((code) => locales[code]),
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function languageFromPath(pathname: string): SiteLanguage {
  const first = pathname.split("/")[1];
  return first === "es" || first === "ca" ? first : "en";
}

// The same page in another language; a page the site has only once leads to that
// language's home.
export function localisePath(pathname: string, language: SiteLanguage) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "es" || parts[0] === "ca") parts.shift();
  if (parts.length === 0) return homePath(language);
  if (parts.length === 1 && translatedPages.includes(parts[0]))
    return `${homePath(language)}${parts[0]}/`;
  return homePath(language);
}
