import type { SiteLanguage } from "../content/site";
import HomeDaybook from "./HomeDaybook";
import HomeNova from "./HomeNova";
import HomePop from "./HomePop";

// Exploration: three redesigns of the home page, picked at build time with SITE_VARIANT
// (nova, daybook or pop). The layout puts the same name on <html data-variant>, which
// scopes each one's stylesheet.
export const variant = process.env.SITE_VARIANT || "nova";

export default function HomePage({ language }: { language: SiteLanguage }) {
  if (variant === "daybook") return <HomeDaybook language={language} />;
  if (variant === "pop") return <HomePop language={language} />;
  return <HomeNova language={language} />;
}
