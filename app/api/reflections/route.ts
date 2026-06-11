import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { reflectionsFeed } from "@/lib/feed";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { dayId, questionIndex, body, shared } = await req.json();
  if (!dayId || typeof questionIndex !== "number" || !body?.trim()) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const day = await prisma.day.findFirst({ where: { id: dayId, series: { churchId: user.churchId ?? "__none__" } }, select: { id: true } });
  if (!day) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const isShared = shared !== false;
  const existing = await prisma.reflection.findFirst({ where: { userId: user.id, dayId, questionIndex } });
  const saved = existing
    ? await prisma.reflection.update({ where: { id: existing.id }, data: { body: body.trim(), shared: isShared } })
    : await prisma.reflection.create({ data: { userId: user.id, dayId, questionIndex, body: body.trim(), shared: isShared } });
  return NextResponse.json({ reflection: saved });
}
export async function DELETE(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  const id = sp.get("id"); const dayId = sp.get("dayId"); const qi = sp.get("questionIndex");
  if (id) { await prisma.reflection.deleteMany({ where: { id, userId: user.id } }); return NextResponse.json({ ok: true }); }
  if (dayId && qi !== null) { await prisma.reflection.deleteMany({ where: { userId: user.id, dayId, questionIndex: Number(qi) } }); return NextResponse.json({ ok: true }); }
  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dayId = new URL(req.url).searchParams.get("dayId") || undefined;
  return NextResponse.json({ reflections: await reflectionsFeed(user, dayId) });
}
