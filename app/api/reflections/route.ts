import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { dayId, questionIndex, body } = await req.json();
  if (!dayId || typeof questionIndex !== "number" || !body?.trim()) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const day = await prisma.day.findFirst({ where: { id: dayId, series: { churchId: user.churchId ?? "__none__" } }, select: { id: true } });
  if (!day) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const existing = await prisma.reflection.findFirst({ where: { userId: user.id, dayId, questionIndex } });
  // Auto-share reflections to the church feed (shared: true). Prayers stay private.
  const saved = existing
    ? await prisma.reflection.update({ where: { id: existing.id }, data: { body: body.trim(), shared: true } })
    : await prisma.reflection.create({ data: { userId: user.id, dayId, questionIndex, body: body.trim(), shared: true } });
  return NextResponse.json({ reflection: saved });
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const churchId = user.churchId;
  if (!churchId) return NextResponse.json({ reflections: [] });
  const rows = await prisma.reflection.findMany({
    where: { shared: true, hidden: false, day: { series: { churchId } } },
    orderBy: { createdAt: "desc" }, take: 80,
    include: { user: { select: { id: true, name: true } }, reactions: { select: { type: true, userId: true } }, day: { select: { title: true, order: true } } },
  });
  const feed = rows.map((r: (typeof rows)[number]) => ({
    id: r.id, body: r.body, author: r.anonymous ? "Anonymous" : r.user.name ?? "Someone", isMine: r.userId === user.id,
    dayTitle: r.day.title, dayOrder: r.day.order,
    amen: r.reactions.filter((x: { type: string }) => x.type === "AMEN").length,
    praying: r.reactions.filter((x: { type: string }) => x.type === "PRAYING").length,
    iReacted: { amen: r.reactions.some((x: { type: string; userId: string }) => x.type === "AMEN" && x.userId === user.id), praying: r.reactions.some((x: { type: string; userId: string }) => x.type === "PRAYING" && x.userId === user.id) },
  }));
  return NextResponse.json({ reflections: feed });
}
