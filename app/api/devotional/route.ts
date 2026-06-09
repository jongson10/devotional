import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { fetchEsvPassage, ESV_COPYRIGHT } from "@/lib/esv";
import { isDayOpen } from "@/lib/unlock";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const dayId = searchParams.get("dayId");
  const where = dayId ? { id: dayId } : null;
  if (!where) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const day = await prisma.day.findFirst({ where, include: { series: { select: { id: true, title: true, weekNumber: true, churchId: true, published: true, startDate: true, church: { select: { timezone: true, name: true } } } } } });
  if (!day) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (day.series.churchId !== user.churchId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  if (!day.series.published && user.role === "MEMBER") return NextResponse.json({ error: "not published" }, { status: 403 });
  const tz = day.series.church?.timezone || "UTC";
  if (user.role === "MEMBER" && !isDayOpen(day.series.startDate, day.order, tz)) return NextResponse.json({ error: "locked" }, { status: 403 });
  let passageText = day.passageText?.trim() || "";
  let esv = false;
  if (!passageText) { const fetched = await fetchEsvPassage(day.passageRef); if (fetched) { passageText = fetched; esv = true; } }
  const [progress, myReflections, myPrayer] = await Promise.all([
    prisma.dayProgress.findUnique({ where: { userId_dayId: { userId: user.id, dayId: day.id } } }),
    prisma.reflection.findMany({ where: { userId: user.id, dayId: day.id }, orderBy: { questionIndex: "asc" } }),
    prisma.prayer.findFirst({ where: { userId: user.id, dayId: day.id }, orderBy: { createdAt: "desc" } }),
  ]);
  return NextResponse.json({
    day: {
      id: day.id, order: day.order, title: day.title, passageRef: day.passageRef, passageText,
      passageRefsExtra: day.passageRefsExtra, pastorNote: day.pastorNote, teaching: day.teaching,
      reflectionQuestions: day.reflectionQuestions, prayerPrompt: day.prayerPrompt, pointsReward: day.pointsReward,
      seriesTitle: day.series.title, weekNumber: day.series.weekNumber, esv, esvCopyright: esv ? ESV_COPYRIGHT : null,
    },
    progress: { step: progress?.step ?? 0, completed: progress?.completed ?? false },
    myReflections: myReflections.map((r: (typeof myReflections)[number]) => ({ questionIndex: r.questionIndex, body: r.body })),
    myPrayer: myPrayer ? { body: myPrayer.body, shared: myPrayer.shared } : null,
  });
}
