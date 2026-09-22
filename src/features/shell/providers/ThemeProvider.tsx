import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useThemeStore } from "../stores/useThemeStore";
import { useIsImmersiveRoute } from "../hooks/useIsImmersiveRoute";
import { ThemeContext, type ResolvedTheme, type ThemeContextValue } from "./theme-context";

const MEDIA = "(prefers-color-scheme: dark)";

function systemPrefersDark(): boolean {
  return typeof window !== "undefined" && window.matchMedia(MEDIA).matches;
}

/**
 * Source unique du thème : résout la préférence (immersion + système), applique la classe
 * `.dark` sur `<html>` (seul écrivain DOM) et suit la préférence système.
 *
 * L'immersion est **dérivée de la route** (et non d'un flag monté/démonté par écran), ce qui
 * supprime tout état intermédiaire au retour d'un duel ou d'un lobby.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isImmersive = useIsImmersiveRoute();
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  useEffect(() => {
    const media = window.matchMedia(MEDIA);
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme: ResolvedTheme = isImmersive
    ? "dark"
    : theme === "system"
      ? systemDark
        ? "dark"
        : "light"
      : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
