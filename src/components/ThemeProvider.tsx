"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Icon from "./Icon";
import { useSiteLanguage } from "./useSiteLanguage";
import { copy } from "../content/site";

type Theme = "light" | "dark";
const ThemeContext = createContext({
  theme: "light" as Theme,
  ready: false,
  choose: (_value: Theme) => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const chosen = useRef(false);
  const apply = (value: Theme) => {
    document.documentElement.dataset.theme = value;
    // One meta per colour scheme; all of them follow the chosen theme.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) =>
        meta.setAttribute("content", value === "dark" ? "#121c18" : "#f7f8f2"),
      );
    setTheme(value);
  };
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      let stored;
      try {
        stored = localStorage.getItem("taskflow-theme");
      } catch {}
      chosen.current = stored === "light" || stored === "dark";
      apply(
        stored === "dark" || (!chosen.current && media.matches)
          ? "dark"
          : "light",
      );
    };
    const followSystem = () => {
      if (!chosen.current) apply(media.matches ? "dark" : "light");
    };
    const storageChanged = (event: StorageEvent) => {
      if (event.key === "taskflow-theme" || event.key === null) sync();
    };
    sync();
    setReady(true);
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", storageChanged);
    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", storageChanged);
    };
  }, []);
  const choose = (value: Theme) => {
    chosen.current = true;
    try {
      localStorage.setItem("taskflow-theme", value);
    } catch {}
    apply(value);
  };
  return (
    <ThemeContext.Provider value={{ theme, choose, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

// The desktop header's icon switch.
export function ThemeToggle() {
  const { theme, choose, ready } = useContext(ThemeContext);
  const { frame } = copy[useSiteLanguage()];
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "dark" ? frame.toDark : frame.toLight;
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={() => choose(next)}
      aria-label={label}
      title={label}
      disabled={!ready}
    >
      <Icon name="moon" className="light-only" />
      <Icon name="sun" className="dark-only" />
    </button>
  );
}

// The phone menu's Appearance row: both choices named, the current one pressed.
export function AppearanceChoice() {
  const { theme, choose, ready } = useContext(ThemeContext);
  const { frame } = copy[useSiteLanguage()];
  return (
    <div
      className="appearance-choice"
      role="group"
      aria-labelledby="appearance-label"
    >
      <span id="appearance-label">{frame.appearance}</span>
      <div>
        {(["light", "dark"] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={theme === value}
            onClick={() => choose(value)}
            disabled={!ready}
          >
            {theme === value && <Icon name="check" size={18} />}
            {value === "light" ? frame.light : frame.dark}
          </button>
        ))}
      </div>
    </div>
  );
}
