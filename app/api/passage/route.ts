import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { fetchEsvPassage } from "@/lib/esv";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const ref = new URL(req.url).searchParams.get("ref") || "";
  const text = await fetchEsvPassage(ref);
  return NextResponse.json({ text });
}
