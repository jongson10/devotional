import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export async function POST(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (user.churchId) return NextResponse.json({ ok: true, already: true });
  const code = String((await req.json())?.code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,16}$/.test(code)) return NextResponse.json({ error: "That doesn't look like a valid code." }, { status: 400 });
  const church = await prisma.church.findFirst({ where: { joinCode: code } as any, select: { id: true } });
  if (!church) return NextResponse.json({ error: "No church found with that code. Check it and try again." }, { status: 404 });
  await prisma.user.update({ where: { id: user.id }, data: { churchId: church.id } });
  return NextResponse.json({ ok: true });
}
