import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (typeof body.name === "string") { const clean = body.name.trim().slice(0, 60); if (clean) data.name = clean; }
  if (typeof body.bio === "string") { data.bio = body.bio.trim().slice(0, 300) || null; }
  if (typeof body.image === "string") { data.image = body.image.trim().slice(0, 600) || null; }
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data });
  return NextResponse.json({ ok: true });
}
