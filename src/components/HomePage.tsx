import type { SiteLanguage } from "../content/site";
import HomeNova from "./HomeNova";

// The home page, in each language. Its look is Nova (src/styles/nova.css), scoped by
// <html data-variant="nova"> in the layout.
export default function HomePage({ language }: { language: SiteLanguage }) {
  return <HomeNova language={language} />;
}
