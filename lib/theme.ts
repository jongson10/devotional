export type ThemeKey = "dawn" | "night";
export function resolveAuto(date = new Date()): ThemeKey { const h = date.getHours(); return h >= 6 && h < 18 ? "dawn" : "night"; }
