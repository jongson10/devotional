import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { devotionalPayload } from "@/lib/feed";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const dayId = new URL(req.url).searchParams.get("dayId");
  const r = await devotionalPayload(user, dayId);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  return NextResponse.json(r);
}
