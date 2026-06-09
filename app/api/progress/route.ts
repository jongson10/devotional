import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStreak, recordCompletion, addPoints } from "@/lib/streaks";
import { streakState } from "@/lib/feed";
import { isDayOpen, isOnTime } from "@/lib/unlock";
export const dynamic = "force-dynamic";
const STEP_WEIGHTS = [0.17, 0.33, 0.33, 0.17];
function starsForStep(step: number, total: number): number { let acc = 0; for (let i = 0; i < step && i < STEP_WEIGHTS.length; i++) acc += STEP_WEIGHTS[i]; return Math.round(total * acc); }
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json(await streakState(user.id));
}
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { dayId, step } = await req.json();
  const reached = Number(step);
  if (!dayId || !(reached >= 1 && reached <= 4)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const day = await prisma.day.findFirst({ where: { id: dayId, series: { churchId: user.churchId ?? "__none__" } }, select: { id: true, order: true, pointsReward: true, series: { select: { startDate: true, church: { select: { timezone: true } } } } } });
  if (!day) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const tz = day.series.church?.timezone || "UTC";
  if (user.role === "MEMBER" && !isDayOpen(day.series.startDate, day.order, tz)) return NextResponse.json({ error: "locked" }, { status: 403 });
  const existing = await prisma.dayProgress.findUnique({ where: { userId_dayId: { userId: user.id, dayId } } });
  const prevStep = existing?.step ?? 0;
  if (reached <= prevStep) { const state = await getStreak(user.id); return NextResponse.json({ noChange: true, step: prevStep, completed: existing?.completed ?? false, ...state }); }
  const total = day.pointsReward;
  const newCumulative = starsForStep(reached, total);
  const prevCumulative = existing?.pointsEarned ?? 0;
  const delta = Math.max(0, newCumulative - prevCumulative);
  const completed = reached >= 4;
  const onTime = user.role !== "MEMBER" || isOnTime(day.series.startDate, day.order, tz);
  await prisma.dayProgress.upsert({
    where: { userId_dayId: { userId: user.id, dayId } },
    create: { userId: user.id, dayId, step: reached, completed, onTime, pointsEarned: newCumulative },
    update: { step: reached, completed, pointsEarned: newCumulative, ...(completed ? { completedAt: new Date(), onTime } : {}) },
  });
  let state;
  if (completed && onTime) state = await recordCompletion(user.id, delta); else state = await addPoints(user.id, delta);
  return NextResponse.json({ noChange: false, step: reached, completed, onTime, awarded: delta, ...state });
}
