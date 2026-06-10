export type DayStatus = "open" | "future" | "missed" | "always";
function ymdInTz(date: Date, tz: string): string {
  try { return new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(date); }
  catch { return date.toISOString().slice(0, 10); }
}
// startDate is a calendar date stored at UTC midnight (from a date picker), so read it
// back by its UTC date — NOT projected through a timezone, which would shift it a day.
const ymdUTC = (date: Date): string => date.toISOString().slice(0, 10);
function dayOffset(startDate: Date, tz: string, now: Date): number {
  const a = new Date(ymdUTC(startDate) + "T00:00:00Z").getTime();
  const b = new Date(ymdInTz(now, tz) + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86400000);
}
export function dayStatus(startDate: Date | null | undefined, order: number, tz = "UTC", now = new Date()): DayStatus {
  if (!startDate) return "always";
  const offset = dayOffset(startDate, tz, now); const target = order - 1;
  if (offset === target) return "open";
  return offset < target ? "future" : "missed";
}
export function isDayOpen(startDate: Date | null | undefined, order: number, tz = "UTC", now = new Date()): boolean {
  const s = dayStatus(startDate, order, tz, now); return s === "open" || s === "always" || s === "missed";
}
export function isOnTime(startDate: Date | null | undefined, order: number, tz = "UTC", now = new Date()): boolean {
  const s = dayStatus(startDate, order, tz, now); return s === "open" || s === "always";
}
export function unlockDate(startDate: Date | null | undefined, order: number): Date | null {
  if (!startDate) return null;
  const d = new Date(ymdUTC(startDate) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + (order - 1)); return d;
}
