import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "midnight" | "daylight";
const ThemeContext = createContext<{ mode: Mode; toggle: () => void }>({
  mode: "midnight",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("midnight");

  useEffect(() => {
    const stored = window.localStorage.getItem("ishq-theme") as Mode | null;
    if (stored) setMode(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("daylight", mode === "daylight");
    window.localStorage.setItem("ishq-theme", mode);
  }, [mode]);

  return (
    <ThemeContext.Provider
      value={{ mode, toggle: () => setMode((m) => (m === "midnight" ? "daylight" : "midnight")) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);