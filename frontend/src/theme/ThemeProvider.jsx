import { createContext, useContext, useEffect, useMemo, useState } from "react";

const ThemeContext = createContext(null);
export const themeStorageKey = "canvasguard-theme";

export const getStoredTheme = () => localStorage.getItem(themeStorageKey) || "dark";

export function applyTheme(theme, disableTransitions = false) {
  const root = document.documentElement;
  if (disableTransitions) root.classList.add("theme-switching");
  root.dataset.theme = theme === "dark" ? "canvasguard-dark" : "canvasguard-light";
  root.classList.toggle("dark", theme === "dark");
  if (disableTransitions) {
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(theme, true);
    localStorage.setItem(themeStorageKey, theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark"),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
