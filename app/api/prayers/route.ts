import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { dayId, body, shared, anonymous } = await req.json();
  if (!body?.trim()) return NextResponse.json({ error: "bad request" }, { status: 400 });
  if (dayId) { const day = await prisma.day.findFirst({ where: { id: dayId, series: { churchId: user.churchId ?? "__none__" } }, select: { id: true } }); if (!day) return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
  const existing = dayId ? await prisma.prayer.findFirst({ where: { userId: user.id, dayId } }) : null;
  const prayer = existing
    ? await prisma.prayer.update({ where: { id: existing.id }, data: { body: body.trim(), shared: shared === true, anonymous: anonymous === true } })
    : await prisma.prayer.create({ data: { userId: user.id, dayId: dayId || null, body: body.trim(), shared: shared === true, anonymous: anonymous === true } });
  return NextResponse.json({ prayer });
}
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const churchId = user.churchId;
  if (!churchId) return NextResponse.json({ prayers: [] });
  const rows = await prisma.prayer.findMany({ where: { shared: true, hidden: false, user: { churchId } }, orderBy: { createdAt: "desc" }, take: 80, include: { user: { select: { id: true, name: true } }, reactions: { select: { type: true, userId: true } } } });
  const room = rows.map((p: (typeof rows)[number]) => ({
    id: p.id, body: p.body, author: p.anonymous ? "Anonymous" : p.user.name ?? "Someone", isMine: p.userId === user.id,
    praying: p.reactions.filter((x: { type: string }) => x.type === "PRAYING").length,
    iPrayed: p.reactions.some((x: { type: string; userId: string }) => x.type === "PRAYING" && x.userId === user.id),
    createdAt: p.createdAt,
  }));
  return NextResponse.json({ prayers: room });
}
