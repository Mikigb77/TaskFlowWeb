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

type Theme = "light" | "dark";
const ThemeContext = createContext({
  theme: "light" as Theme,
  ready: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);
  const chosen = useRef(false);
  const apply = (value: Theme) => {
    document.documentElement.dataset.theme = value;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", value === "dark" ? "#121c18" : "#f7f8f2");
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
  const toggle = () => {
    const value = theme === "light" ? "dark" : "light";
    chosen.current = true;
    try {
      localStorage.setItem("taskflow-theme", value);
    } catch {}
    apply(value);
  };
  return (
    <ThemeContext.Provider value={{ theme, toggle, ready }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function ThemeToggle({
  variant = "icon",
}: {
  variant?: "icon" | "mood";
}) {
  const { theme, toggle, ready } = useContext(ThemeContext);
  const next = theme === "dark" ? "light" : "dark";
  const label =
    variant === "mood"
      ? `Try a different mood: switch to ${next} mode`
      : `Switch to ${next} mode`;
  return (
    <button
      type="button"
      className={variant === "mood" ? "button button-outline" : "theme-toggle"}
      onClick={toggle}
      aria-label={label}
      title={label}
      disabled={!ready}
    >
      {variant === "mood" ? (
        <>
          Try a different mood <Icon name="spark" size={18} />
        </>
      ) : (
        <>
          <Icon name="moon" className="light-only" />
          <Icon name="sun" className="dark-only" />
        </>
      )}
    </button>
  );
}
