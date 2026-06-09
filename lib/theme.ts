export type ThemeKey = "dawn" | "night";
export const themes: Record<ThemeKey, Record<string, string>> = {
  dawn: {
    gradient: "linear-gradient(165deg,#FAF3E4 0%,#F5E7C4 30%,#EDD49E 58%,#DCB264 100%)",
    ink: "#2E2410", accent: "#A9741B",
  },
  night: {
    gradient: "linear-gradient(165deg,#2A2440 0%,#241E38 35%,#1C182C 70%,#14111F 100%)",
    ink: "#F2EEFA", accent: "#B79BE8",
  },
};
export function resolveAuto(date = new Date()): ThemeKey {
  const h = date.getHours();
  return h >= 6 && h < 18 ? "dawn" : "night";
}
