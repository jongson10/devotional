import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";

// Post a reply on a reflection or prayer (optionally nested under a parent comment).
// prisma.comment cast as any until the client is regenerated on deploy.
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { reflectionId, prayerId, parentId, body } = await req.json();
  const text = String(body ?? "").trim();
  if (!text || (!reflectionId && !prayerId)) return NextResponse.json({ error: "bad request" }, { status: 400 });
  const churchId = user.churchId ?? "__none__";

  // The target post must belong to the user's church.
  if (reflectionId) {
    const r = await prisma.reflection.findFirst({ where: { id: reflectionId, day: { series: { churchId } } }, select: { id: true } });
    if (!r) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } else {
    const p = await prisma.prayer.findFirst({ where: { id: prayerId, user: { churchId } }, select: { id: true } });
    if (!p) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  // A parent reply must hang off the same post.
  if (parentId) {
    const parent = await (prisma as any).comment.findFirst({ where: { id: parentId, ...(reflectionId ? { reflectionId } : { prayerId }) }, select: { id: true } });
    if (!parent) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const comment = await (prisma as any).comment.create({
    data: { userId: user.id, body: text.slice(0, 2000), reflectionId: reflectionId || null, prayerId: prayerId || null, parentId: parentId || null },
  });
  return NextResponse.json({ comment: { id: comment.id } });
}
