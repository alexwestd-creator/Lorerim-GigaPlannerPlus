import { createContext, useContext, useEffect, type ReactNode } from "react";
import type { Labels, Theme } from "@/data/schemas";

interface ThemeContextValue {
  theme: Theme;
  labels: Labels;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function toCssVarName(key: string): string {
  return `--color-${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
}

interface ThemeProviderProps {
  theme: Theme;
  labels: Labels;
  children: ReactNode;
}

export function ThemeProvider({ theme, labels, children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.mode;

    for (const [key, value] of Object.entries(theme.colors)) {
      root.style.setProperty(toCssVarName(key), value);
    }

    root.style.setProperty("--font-heading", theme.fonts.heading);
    root.style.setProperty("--font-body", theme.fonts.body);

    for (const [key, value] of Object.entries(theme.radius)) {
      root.style.setProperty(`--radius-${key}`, value);
    }

    for (const [key, value] of Object.entries(theme.shadows)) {
      root.style.setProperty(`--shadow-${key}`, value);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, labels }}>{children}</ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useThemeConfig must be used within ThemeProvider");
  }
  return ctx;
}

export function usePanelLabels(panelId: string): Record<string, string> {
  const { labels } = useThemeConfig();
  return labels.panels[panelId] ?? {};
}
