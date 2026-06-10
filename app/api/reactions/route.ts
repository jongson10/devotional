import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { type, reflectionId, prayerId, commentId } = await req.json();
  if (!["AMEN","PRAYING"].includes(type) || (!reflectionId && !prayerId && !commentId)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const where = commentId
    ? { userId_type_commentId: { userId: user.id, type, commentId } }
    : reflectionId
    ? { userId_type_reflectionId: { userId: user.id, type, reflectionId } }
    : { userId_type_prayerId: { userId: user.id, type, prayerId } };
  const existing = await prisma.reaction.findUnique({ where: where as any });
  if (existing) { await prisma.reaction.delete({ where: { id: existing.id } }); return NextResponse.json({ reacted: false }); }
  await prisma.reaction.create({ data: { userId: user.id, type, reflectionId: reflectionId || null, prayerId: prayerId || null, commentId: commentId || null } as any });
  return NextResponse.json({ reacted: true });
}
