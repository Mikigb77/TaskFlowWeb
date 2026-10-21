"use client";

import { useSiteLanguage } from "./useSiteLanguage";
import { copy } from "../content/site";

// The first Tab stop on every page, in the page's language. Activating it
// moves focus into the content, so the next Tab starts there.
export default function SkipLink() {
  const language = useSiteLanguage();
  const focusContent = () => {
    const main = document.getElementById("main-content");
    if (!main) return;
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
    main.focus();
  };
  return (
    <a
      className="skip-link"
      href="#main-content"
      lang={language}
      onClick={focusContent}
    >
      {copy[language].frame.skipToContent}
    </a>
  );
}
