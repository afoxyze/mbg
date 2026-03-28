import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "mbg-theme";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;

  // Fall back to system preference
  if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";

  return "light";
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

interface UseThemeReturn {
  readonly theme: Theme;
  readonly isDark: boolean;
  readonly toggleTheme: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setTheme] = useState<Theme>(() => {
    const initial = getInitialTheme();
    applyTheme(initial);
    return initial;
  });

  // Keep the DOM class in sync whenever theme changes
  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function toggleTheme(): void {
    setTheme((current) => (current === "light" ? "dark" : "light"));
  }

  return { theme, isDark: theme === "dark", toggleTheme };
}
