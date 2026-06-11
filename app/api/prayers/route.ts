import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { prayerRoom } from "@/lib/feed";
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
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dayId = new URL(req.url).searchParams.get("dayId") || undefined;
  return NextResponse.json({ prayers: await prayerRoom(user, dayId) });
}
