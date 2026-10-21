"use client";

import { useParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import {
  isSiteLanguage,
  languageFromPath,
  type SiteLanguage,
} from "../content/site";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

function fromLocation() {
  return languageFromPath(window.location.pathname);
}

// The page's language, from its URL. The server render and hydration read the route's
// `language` param, which comes from the page that was rendered: the 404 page is
// prerendered once without one and served at any path, so it hydrates in English and
// then follows the address (/es/no-such-page/ → es) without a hydration mismatch.
export function useSiteLanguage(): SiteLanguage {
  const { language } = useParams<{ language?: string }>() ?? {};
  const rendered: SiteLanguage = isSiteLanguage(language) ? language : "en";
  return useSyncExternalStore(subscribe, fromLocation, () => rendered);
}
