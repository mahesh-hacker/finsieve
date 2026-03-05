import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { useSelector } from "react-redux";
import { RootState } from "../store";

// ─── Types ────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "light",
  resolvedTheme: "light",
  setThemeMode: () => {},
});

// ─── Helper: get system preference ───────────────────────────
const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

// ─── Helper: resolve effective theme ─────────────────────────
const resolveTheme = (mode: ThemeMode): ResolvedTheme =>
  mode === "system" ? getSystemTheme() : mode;

// ─── Provider ────────────────────────────────────────────────
export const ThemeContextProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Read saved preference (only matters when authenticated)
  const savedMode = localStorage.getItem("fs-theme-mode") as ThemeMode | null;

  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    isAuthenticated && savedMode ? savedMode : "light",
  );

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(
    isAuthenticated && savedMode ? resolveTheme(savedMode) : "light",
  );

  // When auth changes, sync theme from localStorage (setState in callback to avoid cascading render)
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isAuthenticated) {
        setThemeModeState("light");
        setResolvedTheme("light");
      } else {
        const saved = localStorage.getItem("fs-theme-mode") as ThemeMode | null;
        const mode = saved || "light";
        setThemeModeState(mode);
        setResolvedTheme(resolveTheme(mode));
      }
    }, 0);
    return () => clearTimeout(t);
  }, [isAuthenticated]);

  // Listen for system theme changes (relevant when mode === "system")
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (themeMode === "system") {
        setResolvedTheme(getSystemTheme());
      }
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [themeMode]);

  // Set data attribute on <html> for CSS variable switching
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedTheme);
  }, [resolvedTheme]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      setResolvedTheme(resolveTheme(mode));
      if (isAuthenticated) {
        localStorage.setItem("fs-theme-mode", mode);
      }
    },
    [isAuthenticated],
  );

  const value = useMemo(
    () => ({ themeMode, resolvedTheme, setThemeMode }),
    [themeMode, resolvedTheme, setThemeMode],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

// Hooks are not components; allow export for react-refresh
/* eslint-disable react-refresh/only-export-components */
export const useThemeMode = () => useContext(ThemeContext);
export const useThemeContext = () => useContext(ThemeContext);
