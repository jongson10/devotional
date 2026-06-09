import { prisma } from "@/lib/prisma";
import { getStreak, getStreaksBatch, rebuildStreakFromHistory, type StreakState } from "@/lib/streaks";

// Shared read queries used by BOTH the API routes and the server pages, so the two
// can never drift. Pages call these directly (no extra HTTP round-trip); the API
// routes wrap them for client-side callers (e.g. the community sheet, reaction refreshes).

export type FeedUser = { id: string; churchId: string | null };

export async function reflectionsFeed(user: FeedUser) {
  if (!user.churchId) return [];
  const rows = await prisma.reflection.findMany({
    where: { shared: true, hidden: false, day: { series: { churchId: user.churchId } } },
    orderBy: { createdAt: "desc" }, take: 80,
    include: { user: { select: { id: true, name: true } }, reactions: { select: { type: true, userId: true } }, day: { select: { title: true, order: true } } },
  });
  return rows.map((r) => ({
    id: r.id, body: r.body, author: r.anonymous ? "Anonymous" : r.user.name ?? "Someone", isMine: r.userId === user.id,
    dayTitle: r.day.title, dayOrder: r.day.order,
    amen: r.reactions.filter((x) => x.type === "AMEN").length,
    praying: r.reactions.filter((x) => x.type === "PRAYING").length,
    iReacted: { amen: r.reactions.some((x) => x.type === "AMEN" && x.userId === user.id), praying: r.reactions.some((x) => x.type === "PRAYING" && x.userId === user.id) },
  }));
}

export async function prayerRoom(user: FeedUser) {
  if (!user.churchId) return [];
  const rows = await prisma.prayer.findMany({
    where: { shared: true, hidden: false, user: { churchId: user.churchId } },
    orderBy: { createdAt: "desc" }, take: 80,
    include: { user: { select: { id: true, name: true } }, reactions: { select: { type: true, userId: true } } },
  });
  return rows.map((p) => ({
    id: p.id, body: p.body, author: p.anonymous ? "Anonymous" : p.user.name ?? "Someone", isMine: p.userId === user.id,
    praying: p.reactions.filter((x) => x.type === "PRAYING").length,
    iPrayed: p.reactions.some((x) => x.type === "PRAYING" && x.userId === user.id),
    createdAt: p.createdAt,
  }));
}

export type LeaderboardRow = { id: string; name: string; isMe: boolean; streak: number; stars: number; daysCompleted: number };

export async function leaderboardRows(user: FeedUser): Promise<LeaderboardRow[]> {
  if (!user.churchId) return [];
  const churchId = user.churchId;
  const [members, completedCounts] = await Promise.all([
    prisma.user.findMany({ where: { churchId }, select: { id: true, name: true, email: true } }),
    prisma.dayProgress.groupBy({ by: ["userId"], where: { user: { churchId }, completed: true }, _count: { _all: true } }),
  ]);
  const doneByUser = new Map<string, number>(completedCounts.map((c) => [c.userId, c._count._all]));
  const streaks = await getStreaksBatch(members.map((m) => m.id)).catch(() => ({} as Record<string, StreakState>));
  return members.map((m) => {
    const s = streaks[m.id];
    const display = (m.name && m.name.trim()) ? m.name.trim().split(" ")[0] : (m.email ? m.email.split("@")[0] : "Member");
    return { id: m.id, name: display, isMe: m.id === user.id, streak: s?.streak ?? 0, stars: s?.points ?? 0, daysCompleted: doneByUser.get(m.id) ?? 0 };
  });
}

// Streak/points with the one-time rebuild-from-history fallback (for users whose
// Redis state was never initialized but who have completion history in Postgres).
export async function streakState(userId: string): Promise<StreakState> {
  let state = await getStreak(userId);
  if (state.totalDays === 0) {
    const completions = await prisma.dayProgress.findMany({ where: { userId, completed: true }, select: { completedAt: true, pointsEarned: true } });
    if (completions.length > 0) state = await rebuildStreakFromHistory(userId, completions);
  }
  return state;
}
