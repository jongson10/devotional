import { prisma } from "@/lib/prisma";
import { getStreak, getStreaksBatch, rebuildStreakFromHistory, type StreakState } from "@/lib/streaks";
import { fetchEsvPassage, ESV_COPYRIGHT } from "@/lib/esv";
import { isDayOpen } from "@/lib/unlock";

// Shared read queries used by BOTH the API routes and the server pages, so the two
// can never drift. Pages call these directly (no extra HTTP round-trip); the API
// routes wrap them for client-side callers (e.g. the community sheet, reaction refreshes).

export type FeedUser = { id: string; churchId: string | null };

// ---- Replies (one level, Twitter-style) on reflections/prayers ----
// prisma.comment cast as any until the client is regenerated (prisma db push) in deploy.
function commentNode(c: any, userId: string): any {
  return {
    id: c.id, author: c.user?.name ?? "Someone", isMine: c.userId === userId, body: c.body, createdAt: c.createdAt?.toISOString?.() ?? null,
    amen: c.reactions.filter((x: any) => x.type === "AMEN").length,
    praying: c.reactions.filter((x: any) => x.type === "PRAYING").length,
    iReacted: { amen: c.reactions.some((x: any) => x.type === "AMEN" && x.userId === userId), praying: c.reactions.some((x: any) => x.type === "PRAYING" && x.userId === userId) },
  };
}
// Flat list of replies per post, oldest first.
async function commentsByPost(field: "reflectionId" | "prayerId", postIds: string[], userId: string): Promise<Map<string, any[]>> {
  const byPost = new Map<string, any[]>();
  if (postIds.length === 0) return byPost;
  const flat: any[] = await (prisma as any).comment.findMany({
    where: { [field]: { in: postIds }, hidden: false },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, name: true } }, reactions: { select: { type: true, userId: true } } },
  });
  for (const c of flat) { const pid = c[field]; if (!byPost.has(pid)) byPost.set(pid, []); byPost.get(pid)!.push(commentNode(c, userId)); }
  return byPost;
}

// One thread per DAY: everyone's reflections for a day are threaded together.
// Threads ordered by most-recent activity; posts within a thread read oldest-first.
export async function reflectionsFeed(user: FeedUser) {
  if (!user.churchId) return [];
  const rows = await prisma.reflection.findMany({
    where: { shared: true, hidden: false, day: { series: { churchId: user.churchId } } },
    orderBy: { createdAt: "asc" }, take: 300,
    include: { user: { select: { id: true, name: true, image: true } }, reactions: { select: { type: true, userId: true } }, day: { select: { id: true, title: true, order: true, series: { select: { title: true } } } } },
  });
  const commentsMap = await commentsByPost("reflectionId", rows.map((r) => r.id), user.id);
  type Post = { id: string; author: string; image: string | null; isMine: boolean; body: string; questionIndex: number; amen: number; praying: number; iReacted: { amen: boolean; praying: boolean }; comments: any[] };
  type DayThread = { key: string; dayTitle: string; dayOrder: number; seriesTitle: string; lastAt: number; posts: Post[] };
  const threads = new Map<string, DayThread>();
  for (const r of rows) {
    const key = r.day.id;
    let t = threads.get(key);
    if (!t) { t = { key, dayTitle: r.day.title, dayOrder: r.day.order, seriesTitle: r.day.series.title, lastAt: 0, posts: [] }; threads.set(key, t); }
    t.posts.push({
      id: r.id, author: r.anonymous ? "Anonymous" : r.user.name ?? "Someone", image: r.anonymous ? null : (r.user.image ?? null), isMine: r.userId === user.id, body: r.body, questionIndex: r.questionIndex,
      amen: r.reactions.filter((x) => x.type === "AMEN").length,
      praying: r.reactions.filter((x) => x.type === "PRAYING").length,
      iReacted: { amen: r.reactions.some((x) => x.type === "AMEN" && x.userId === user.id), praying: r.reactions.some((x) => x.type === "PRAYING" && x.userId === user.id) },
      comments: commentsMap.get(r.id) ?? [],
    });
    t.lastAt = Math.max(t.lastAt, new Date(r.createdAt).getTime());
  }
  return Array.from(threads.values()).sort((a, b) => b.lastAt - a.lastAt);
}

export async function prayerRoom(user: FeedUser) {
  if (!user.churchId) return [];
  const rows = await prisma.prayer.findMany({
    where: { shared: true, hidden: false, user: { churchId: user.churchId } },
    orderBy: { createdAt: "desc" }, take: 80,
    include: { user: { select: { id: true, name: true, image: true } }, reactions: { select: { type: true, userId: true } } },
  });
  const commentsMap = await commentsByPost("prayerId", rows.map((p) => p.id), user.id);
  return rows.map((p) => ({
    id: p.id, body: p.body, author: p.anonymous ? "Anonymous" : p.user.name ?? "Someone", image: p.anonymous ? null : (p.user.image ?? null), isMine: p.userId === user.id,
    praying: p.reactions.filter((x) => x.type === "PRAYING").length,
    iPrayed: p.reactions.some((x) => x.type === "PRAYING" && x.userId === user.id),
    createdAt: p.createdAt,
    comments: commentsMap.get(p.id) ?? [],
  }));
}

export type LeaderboardRow = { id: string; name: string; image: string | null; isMe: boolean; streak: number; stars: number; daysCompleted: number };

export async function leaderboardRows(user: FeedUser): Promise<LeaderboardRow[]> {
  if (!user.churchId) return [];
  const churchId = user.churchId;
  const [members, completedCounts] = await Promise.all([
    prisma.user.findMany({ where: { churchId }, select: { id: true, name: true, email: true, image: true } }),
    prisma.dayProgress.groupBy({ by: ["userId"], where: { user: { churchId }, completed: true }, _count: { _all: true } }),
  ]);
  const doneByUser = new Map<string, number>(completedCounts.map((c) => [c.userId, c._count._all]));
  const streaks = await getStreaksBatch(members.map((m) => m.id)).catch(() => ({} as Record<string, StreakState>));
  return members.map((m) => {
    const s = streaks[m.id];
    const display = (m.name && m.name.trim()) ? m.name.trim().split(" ")[0] : (m.email ? m.email.split("@")[0] : "Member");
    return { id: m.id, name: display, image: (m as any).image ?? null, isMe: m.id === user.id, streak: s?.streak ?? 0, stars: s?.points ?? 0, daysCompleted: doneByUser.get(m.id) ?? 0 };
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

// Per-member activity for a church: role, last visit (lastSeenAt), last completion,
// and a combined lastActiveAt. Drives the Members admin, the Activity list, and
// Community's "last active". Sorted most-recently-active first.
export type MemberActivity = { id: string; name: string; image: string | null; email: string; role: "MEMBER" | "ADMIN" | "OWNER"; lastSeenAt: string | null; lastCompletedAt: string | null; lastActiveAt: string | null; daysCompleted: number; isMe: boolean };

export async function memberActivity(user: FeedUser): Promise<MemberActivity[]> {
  if (!user.churchId) return [];
  const churchId = user.churchId;
  const [members, lastDone] = await Promise.all([
    // lastSeenAt cast: Prisma client types regenerate on db push / build.
    prisma.user.findMany({ where: { churchId }, select: { id: true, name: true, email: true, role: true, image: true, lastSeenAt: true } as any }),
    prisma.dayProgress.groupBy({ by: ["userId"], where: { user: { churchId }, completed: true }, _max: { completedAt: true }, _count: { _all: true } }),
  ]);
  const doneMap = new Map(lastDone.map((d) => [d.userId, { last: d._max.completedAt as Date | null, count: d._count._all }]));
  const rows: MemberActivity[] = (members as any[]).map((m) => {
    const d = doneMap.get(m.id);
    const display = (m.name && m.name.trim()) ? m.name.trim() : (m.email ? m.email.split("@")[0] : "Member");
    const seenT = m.lastSeenAt ? new Date(m.lastSeenAt).getTime() : 0;
    const doneT = d?.last ? new Date(d.last).getTime() : 0;
    const lastActive = Math.max(seenT, doneT);
    return {
      id: m.id, name: display, image: m.image ?? null, email: m.email, role: m.role,
      lastSeenAt: m.lastSeenAt ? new Date(m.lastSeenAt).toISOString() : null,
      lastCompletedAt: d?.last ? new Date(d.last).toISOString() : null,
      lastActiveAt: lastActive ? new Date(lastActive).toISOString() : null,
      daysCompleted: d?.count ?? 0, isMe: m.id === user.id,
    };
  });
  rows.sort((a, b) => (b.lastActiveAt ? Date.parse(b.lastActiveAt) : 0) - (a.lastActiveAt ? Date.parse(a.lastActiveAt) : 0));
  return rows;
}

// Admin content tab: all of a church's series (with days) plus church settings.
// Shared by the admin API route and the admin page's initial server render.
export async function adminSeriesView(user: FeedUser) {
  if (!user.churchId) return { series: [], church: null };
  const churchId = user.churchId;
  const [series, church] = await Promise.all([
    prisma.series.findMany({ where: { churchId }, orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], include: { days: { orderBy: { order: "asc" } } } }),
    prisma.church.findUnique({ where: { id: churchId }, select: { name: true, timezone: true, reflectionFeedEnabled: true, prayerRoomEnabled: true, gamificationEnabled: true, introText: true } as any }),
  ]);
  return { series, church };
}

// Which feature tabs are enabled for the church (drives the nav).
export async function navConfig(user: FeedUser): Promise<{ reflections: boolean; prayer: boolean; community: boolean }> {
  if (!user.churchId) return { reflections: true, prayer: true, community: true };
  const c: any = await prisma.church.findUnique({ where: { id: user.churchId }, select: { reflectionFeedEnabled: true, prayerRoomEnabled: true, gamificationEnabled: true } });
  return { reflections: c?.reflectionFeedEnabled ?? true, prayer: c?.prayerRoomEnabled ?? true, community: c?.gamificationEnabled ?? true };
}

// Full payload for one day of the devotional flow: the day content (with ESV fallback),
// the user's saved progress, reflections, and prayer. Shared by the API route and the
// /today server page so the page can render without a second client round-trip.
export type DevotionalUser = { id: string; churchId: string | null; role: "MEMBER" | "ADMIN" | "OWNER" };

export async function devotionalPayload(user: DevotionalUser, dayId: string | null) {
  if (!dayId) return { error: "bad request", status: 400 as const };
  const day: any = await prisma.day.findFirst({ where: { id: dayId }, include: { series: { select: { id: true, title: true, weekNumber: true, churchId: true, published: true, startDate: true, introText: true, church: { select: { timezone: true, name: true, introText: true } } } } } as any });
  if (!day) return { error: "not found", status: 404 as const };
  if (day.series.churchId !== user.churchId) return { error: "forbidden", status: 403 as const };
  if (!day.series.published && user.role === "MEMBER") return { error: "not published", status: 403 as const };
  const tz = day.series.church?.timezone || "UTC";
  if (user.role === "MEMBER" && !isDayOpen(day.series.startDate, day.order, tz)) return { error: "locked", status: 403 as const };
  let passageText = day.passageText?.trim() || "";
  let esv = false;
  if (!passageText) { const fetched = await fetchEsvPassage(day.passageRef); if (fetched) { passageText = fetched; esv = true; } }
  const [progress, myReflections, myPrayer] = await Promise.all([
    prisma.dayProgress.findUnique({ where: { userId_dayId: { userId: user.id, dayId: day.id } } }),
    prisma.reflection.findMany({ where: { userId: user.id, dayId: day.id }, orderBy: { questionIndex: "asc" } }),
    prisma.prayer.findFirst({ where: { userId: user.id, dayId: day.id }, orderBy: { createdAt: "desc" } }),
  ]);
  const intro = (day.series.introText || day.series.church?.introText || null) as string | null;
  return {
    day: {
      id: day.id, order: day.order, title: day.title, passageRef: day.passageRef, passageText,
      passageRefsExtra: day.passageRefsExtra, pastorNote: day.pastorNote, teaching: day.teaching,
      reflectionQuestions: day.reflectionQuestions, prayerPrompt: day.prayerPrompt, pointsReward: day.pointsReward,
      seriesTitle: day.series.title, weekNumber: day.series.weekNumber, esv, esvCopyright: esv ? ESV_COPYRIGHT : null, intro,
    },
    progress: { step: progress?.step ?? 0, completed: progress?.completed ?? false },
    myReflections: myReflections.map((r) => ({ questionIndex: r.questionIndex, body: r.body })),
    myPrayer: myPrayer ? { body: myPrayer.body, shared: myPrayer.shared } : null,
  };
}
