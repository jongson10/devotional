import { Redis } from "@upstash/redis";
let _redis: Redis | null = null;
function redis(): Redis {
  if (!_redis) {
    const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
    if (!url || !token) throw new Error("Missing Redis env vars: KV_REST_API_URL/KV_REST_API_TOKEN (or UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN).");
    _redis = new Redis({ url, token });
  }
  return _redis;
}
const ymd = (d: Date) => d.toISOString().slice(0, 10);
function daysBetween(a: string, b: string) { return Math.round((new Date(b+"T00:00:00Z").getTime() - new Date(a+"T00:00:00Z").getTime()) / 86400000); }
export type StreakState = { streak: number; longest: number; lastDay: string | null; points: number; totalDays: number; };
const stateKey = (userId: string) => `streak:${userId}`;
export async function getStreak(userId: string): Promise<StreakState> {
  const s = (await redis().hgetall<Record<string, string>>(stateKey(userId))) || {};
  const today = ymd(new Date());
  let streak = Number(s.streak || 0);
  if (s.lastDay && daysBetween(s.lastDay, today) > 1) streak = 0;
  return { streak, longest: Number(s.longest || 0), lastDay: s.lastDay || null, points: Number(s.points || 0), totalDays: Number(s.totalDays || 0) };
}
export async function recordCompletion(userId: string, pointsEarned: number): Promise<StreakState> {
  const today = ymd(new Date());
  const cur = await getStreak(userId);
  let newStreak: number;
  if (cur.lastDay === today) newStreak = cur.streak || 1;
  else if (cur.lastDay && daysBetween(cur.lastDay, today) === 1) newStreak = (cur.streak || 0) + 1;
  else newStreak = 1;
  const longest = Math.max(cur.longest, newStreak);
  const points = cur.points + pointsEarned;
  const totalDays = cur.lastDay === today ? cur.totalDays : cur.totalDays + 1;
  await redis().hset(stateKey(userId), { streak: String(newStreak), longest: String(longest), lastDay: today, points: String(points), totalDays: String(totalDays) });
  return { streak: newStreak, longest, lastDay: today, points, totalDays };
}
export async function addPoints(userId: string, pointsToAdd: number): Promise<StreakState> {
  const cur = await getStreak(userId);
  const points = cur.points + pointsToAdd;
  await redis().hset(stateKey(userId), { points: String(points) });
  return { ...cur, points };
}
export async function rebuildStreakFromHistory(userId: string, completions: { completedAt: Date; pointsEarned: number }[]): Promise<StreakState> {
  if (completions.length === 0) return { streak: 0, longest: 0, lastDay: null, points: 0, totalDays: 0 };
  const days = Array.from(new Set(completions.map((c) => ymd(new Date(c.completedAt))))).sort();
  let longest = 1, run = 1;
  for (let i = 1; i < days.length; i++) { if (daysBetween(days[i-1], days[i]) === 1) run++; else run = 1; longest = Math.max(longest, run); }
  const today = ymd(new Date());
  let streak = 0;
  const last = days[days.length - 1];
  if (daysBetween(last, today) <= 1) { streak = 1; for (let i = days.length - 1; i > 0; i--) { if (daysBetween(days[i-1], days[i]) === 1) streak++; else break; } }
  const points = completions.reduce((a, c) => a + c.pointsEarned, 0);
  const state: StreakState = { streak, longest, lastDay: last, points, totalDays: days.length };
  await redis().hset(stateKey(userId), { streak: String(state.streak), longest: String(state.longest), lastDay: state.lastDay!, points: String(state.points), totalDays: String(state.totalDays) });
  return state;
}
