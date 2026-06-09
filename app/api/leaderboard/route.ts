import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { leaderboardRows } from "@/lib/feed";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json({ rows: await leaderboardRows(user) });
}
