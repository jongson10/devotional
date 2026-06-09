import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getStreak } from "@/lib/streaks";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!user.churchId) return NextResponse.json({ rows: [] });
  const members = await prisma.user.findMany({ where: { churchId: user.churchId }, select: { id: true, name: true, email: true } });
  const completedCounts = await prisma.dayProgress.groupBy({ by: ["userId"], where: { user: { churchId: user.churchId }, completed: true }, _count: { _all: true } });
  const doneByUser = new Map<string, number>(completedCounts.map((c: { userId: string; _count: { _all: number } }) => [c.userId, c._count._all]));
  const stats = await Promise.all(members.map(async (m: { id: string; name: string | null; email: string }) => {
    const s = await getStreak(m.id).catch(() => ({ streak: 0, points: 0 } as any));
    const display = (m.name && m.name.trim()) ? m.name.trim().split(" ")[0] : (m.email ? m.email.split("@")[0] : "Member");
    return { id: m.id, name: display, isMe: m.id === user.id, streak: s.streak ?? 0, stars: s.points ?? 0, daysCompleted: doneByUser.get(m.id) ?? 0 };
  }));
  return NextResponse.json({ rows: stats });
}
