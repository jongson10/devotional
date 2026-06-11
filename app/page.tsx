import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { streakState } from "@/lib/feed";
import { dayStatus, unlockDate } from "@/lib/unlock";
import HomeView from "@/components/HomeView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const [church, allSeries, streak] = await Promise.all([
    user.churchId ? prisma.church.findUnique({ where: { id: user.churchId }, select: { timezone: true, name: true } }) : Promise.resolve(null),
    user.churchId ? prisma.series.findMany({ where: { churchId: user.churchId, published: true }, orderBy: [{ startDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }], include: { days: { orderBy: { order: "asc" } } } }) : Promise.resolve([]),
    streakState(user.id),
  ]);
  // Record this visit (best-effort; lastSeenAt drives the "last active" lists).
  prisma.user.update({ where: { id: user.id }, data: { lastSeenAt: new Date() } as any }).catch(() => {});
  const tz = church?.timezone || "UTC";
  const isAdmin = user.role !== "MEMBER";

  const seriesIds = allSeries.map((s) => s.id);
  const progressRows = seriesIds.length
    ? await prisma.dayProgress.findMany({ where: { userId: user.id, day: { seriesId: { in: seriesIds } } }, select: { dayId: true, completed: true, onTime: true } })
    : [];
  const doneMap = new Map(progressRows.filter((p) => p.completed).map((p) => [p.dayId, p.onTime] as const));

  const seriesList = allSeries.map((series) => {
    const days = series.days.map((d) => {
      const status = dayStatus(series.startDate, d.order, tz);
      const done = doneMap.has(d.id);
      const lateDone = done && doneMap.get(d.id) === false;
      const openable = isAdmin || status === "open" || status === "always" || status === "missed";
      const uOn = unlockDate(series.startDate, d.order);
      return { id: d.id, order: d.order, title: d.title, passageRef: d.passageRef, pointsReward: d.pointsReward, done, lateDone, status, openable, unlocksOn: uOn ? uOn.toISOString() : null };
    });
    // Only a genuinely-open day counts as "today" — a past, fully-elapsed series gets no today card.
    const todayCard = days.find((d) => d.status === "open") ?? days.find((d) => d.status === "always" && !d.done) ?? null;
    return { id: series.id, title: series.title, subtitle: series.subtitle, weekNumber: series.weekNumber, days, todayCardId: todayCard?.id ?? null };
  });

  return <HomeView name={user.name ?? user.email?.split("@")[0] ?? "friend"} churchName={church?.name ?? "Your church"} seriesList={seriesList} streak={streak.streak} points={streak.points} />;
}
