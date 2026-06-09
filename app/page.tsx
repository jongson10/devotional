import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dayStatus, unlockDate } from "@/lib/unlock";
import HomeView from "@/components/HomeView";
import TopBar from "@/components/TopBar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  if (!user) redirect("/login");

  const [church, series] = await Promise.all([
    user.churchId ? prisma.church.findUnique({ where: { id: user.churchId }, select: { timezone: true, name: true } }) : Promise.resolve(null),
    user.churchId ? prisma.series.findFirst({ where: { churchId: user.churchId, published: true }, orderBy: { createdAt: "desc" }, include: { days: { orderBy: { order: "asc" } } } }) : Promise.resolve(null),
  ]);
  const tz = church?.timezone || "UTC";

  const progressRows = series
    ? await prisma.dayProgress.findMany({ where: { userId: user.id, day: { seriesId: series.id } }, select: { dayId: true, completed: true, onTime: true } })
    : [];
  const doneMap = new Map(progressRows.filter((p: { completed: boolean }) => p.completed).map((p: { dayId: string; onTime: boolean }) => [p.dayId, p.onTime]));
  const isAdmin = user.role !== "MEMBER";

  const days = series?.days.map((d: { id: string; order: number; title: string; passageRef: string; pointsReward: number }) => {
    const status = dayStatus(series.startDate, d.order, tz);
    const done = doneMap.has(d.id);
    const lateDone = done && doneMap.get(d.id) === false;
    const openable = isAdmin || status === "open" || status === "always" || status === "missed";
    const uOn = unlockDate(series.startDate, d.order, tz);
    return { id: d.id, order: d.order, title: d.title, passageRef: d.passageRef, pointsReward: d.pointsReward, done, lateDone, status, openable, unlocksOn: uOn ? uOn.toISOString() : null };
  }) ?? [];

  const todayCard = days.find((d: (typeof days)[number]) => d.status === "open")
    ?? days.find((d: (typeof days)[number]) => d.status === "always" && !d.done)
    ?? days.find((d: (typeof days)[number]) => d.openable && !d.done)
    ?? null;

  return (
    <>
      <TopBar isAdmin={isAdmin} />
      <HomeView name={user.name ?? user.email?.split("@")[0] ?? "friend"} churchName={church?.name ?? "Your church"} seriesTitle={series?.title ?? null} days={days} todayCard={todayCard} />
    </>
  );
}
