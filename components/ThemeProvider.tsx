"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
type Mode = "auto" | "dawn" | "night";
type Resolved = "dawn" | "night";
const ThemeCtx = createContext<{ mode: Mode; resolved: Resolved; setMode: (m: Mode) => void; }>({ mode: "auto", resolved: "dawn", setMode: () => {} });
function resolveAuto(): Resolved { const h = new Date().getHours(); return h >= 6 && h < 18 ? "dawn" : "night"; }
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("auto");
  const [resolved, setResolved] = useState<Resolved>("dawn");
  useEffect(() => { const saved = (typeof window !== "undefined" && (localStorage.getItem("themeMode") as Mode)) || "auto"; setModeState(saved); }, []);
  useEffect(() => { const apply = () => { const r = mode === "auto" ? resolveAuto() : mode; setResolved(r); document.documentElement.setAttribute("data-theme", r); }; apply(); const t = setInterval(apply, 60 * 1000); return () => clearInterval(t); }, [mode]);
  const setMode = (m: Mode) => { setModeState(m); if (typeof window !== "undefined") localStorage.setItem("themeMode", m); };
  return <ThemeCtx.Provider value={{ mode, resolved, setMode }}>{children}</ThemeCtx.Provider>;
}
export const useTheme = () => useContext(ThemeCtx);
