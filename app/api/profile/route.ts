import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function PATCH(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const clean = String(name ?? "").trim().slice(0, 60);
  if (!clean) return NextResponse.json({ error: "bad request" }, { status: 400 });
  await prisma.user.update({ where: { id: user.id }, data: { name: clean } });
  return NextResponse.json({ name: clean });
}
