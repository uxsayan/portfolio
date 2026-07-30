import { useState, useEffect } from "react";

export type Theme = "default-dark" | "default-light" | "ocean-abyss" | "deep-forest" | "lemon-fizz";

const STORAGE_KEY = "sc-portfolio-theme";
const DEFAULT_THEME: Theme = "default-dark";
const VALID_THEMES: Theme[] = ["default-dark", "default-light", "ocean-abyss", "deep-forest", "lemon-fizz"];

function isDarkTheme(theme: Theme): boolean {
  return theme === "default-dark" || theme === "ocean-abyss" || theme === "deep-forest";
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (stored && VALID_THEMES.includes(stored)) return stored;
  if (stored === "sky-blue") return "default-light";
  if ((stored as string) === "depth-forest") return "deep-forest";
  const oldStored = localStorage.getItem("sc-portfolio-dark");
  if (oldStored !== null) return oldStored === "false" ? "default-light" : "default-dark";
  return DEFAULT_THEME;
}

// ── Shared external store so every useTheme() call shares one state ──────────
let _theme: Theme = getInitialTheme();
const _listeners = new Set<(t: Theme) => void>();

function setGlobalTheme(t: Theme) {
  if (t === _theme) return;
  _theme = t;
  localStorage.setItem(STORAGE_KEY, t);
  document.documentElement.setAttribute("data-theme", t);
  _listeners.forEach(fn => fn(t));
}

// Apply on module load (before React renders) so CSS is correct immediately
if (typeof document !== "undefined") {
  document.documentElement.setAttribute("data-theme", _theme);
}

export function useTheme() {
  const [theme, setLocal] = useState<Theme>(_theme);

  useEffect(() => {
    // Sync if global changed before this component mounted
    setLocal(_theme);
    _listeners.add(setLocal);
    return () => { _listeners.delete(setLocal); };
  }, []);

  return {
    theme,
    dark: isDarkTheme(theme),
    setTheme: setGlobalTheme,
  };
}
