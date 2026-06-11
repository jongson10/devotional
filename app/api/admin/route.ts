import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { adminSeriesView, memberActivity } from "@/lib/feed";
import { parseSeriesMarkdown } from "@/lib/seriesImport";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin || !admin.churchId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const view = new URL(req.url).searchParams.get("view") ?? "series";
  const churchId = admin.churchId;
  if (view === "series") {
    return NextResponse.json(await adminSeriesView(admin));
  }
  if (view === "members") {
    return NextResponse.json({ members: await memberActivity(admin) });
  }
  if (view === "activity") {
    const [members, completions, sharedReflections, sharedPrayers, activeUsers] = await Promise.all([
      prisma.user.count({ where: { churchId } }),
      prisma.dayProgress.count({ where: { user: { churchId }, completed: true } }),
      prisma.reflection.count({ where: { shared: true, hidden: false, day: { series: { churchId } } } }),
      prisma.prayer.count({ where: { shared: true, hidden: false, user: { churchId } } }),
      memberActivity(admin),
    ]);
    const since = new Date(Date.now() - 6 * 86400000);
    const recent = await prisma.dayProgress.findMany({ where: { user: { churchId }, completed: true, completedAt: { gte: since } }, select: { completedAt: true } });
    const trend: Record<string, number> = {};
    for (let i = 0; i < 7; i++) { const d = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10); trend[d] = 0; }
    recent.forEach((r: { completedAt: Date }) => { const d = r.completedAt.toISOString().slice(0, 10); if (d in trend) trend[d]++; });
    return NextResponse.json({ members, completions, sharedReflections, sharedPrayers, trend, activeUsers });
  }
  if (view === "moderation") {
    const [reflections, prayers] = await Promise.all([
      prisma.reflection.findMany({ where: { shared: true, day: { series: { churchId } } }, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true } } } }),
      prisma.prayer.findMany({ where: { shared: true, user: { churchId } }, orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true } } } }),
    ]);
    return NextResponse.json({ reflections, prayers });
  }
  return NextResponse.json({ error: "unknown view" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin || !admin.churchId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const churchId = admin.churchId;
  const data = await req.json();
  switch (data.action) {
    case "saveSettings": {
      const tz = String(data.timezone ?? "").trim();
      try { new Intl.DateTimeFormat("en-CA", { timeZone: tz }); } catch { return NextResponse.json({ error: "invalid timezone" }, { status: 400 }); }
      const name = String(data.name ?? "").trim().slice(0, 80);
      const upd: any = { timezone: tz, ...(name ? { name } : {}) };
      if (typeof data.reflectionFeedEnabled === "boolean") upd.reflectionFeedEnabled = data.reflectionFeedEnabled;
      if (typeof data.prayerRoomEnabled === "boolean") upd.prayerRoomEnabled = data.prayerRoomEnabled;
      if (typeof data.gamificationEnabled === "boolean") upd.gamificationEnabled = data.gamificationEnabled;
      if (typeof data.introText === "string") upd.introText = data.introText.trim().slice(0, 600) || null;
      await prisma.church.update({ where: { id: churchId }, data: upd });
      return NextResponse.json({ ok: true });
    }
    case "saveSeries": {
      const { id, title, subtitle, weekNumber, startDate } = data;
      if (id) { const owns = await prisma.series.findFirst({ where: { id, churchId } }); if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 }); }
      const start = startDate ? new Date(startDate) : null;
      const introText = typeof data.introText === "string" ? (data.introText.trim().slice(0, 600) || null) : null;
      const payload: any = { title, subtitle, weekNumber, startDate: start, introText };
      const series = id
        ? await prisma.series.update({ where: { id }, data: payload })
        : await prisma.series.create({ data: { churchId, ...payload } });
      return NextResponse.json({ series });
    }
    case "saveDay": {
      const { seriesId, id, order, title, passageRef, passageText, passageRefsExtra, pastorNote, teaching, reflectionQuestions, prayerPrompt, pointsReward } = data;
      const owns = await prisma.series.findFirst({ where: { id: seriesId, churchId } });
      if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const payload = { seriesId, order: Number(order), title, passageRef, passageText: passageText ?? "", passageRefsExtra: passageRefsExtra || null, pastorNote: pastorNote || null, teaching, reflectionQuestions: reflectionQuestions ?? [], prayerPrompt: prayerPrompt || null, pointsReward: Number(pointsReward ?? 60) };
      const day = id ? await prisma.day.update({ where: { id }, data: payload }) : await prisma.day.create({ data: payload });
      return NextResponse.json({ day });
    }
    case "deleteSeries": {
      const owns = await prisma.series.findFirst({ where: { id: data.seriesId, churchId }, select: { id: true } });
      if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      await prisma.series.delete({ where: { id: data.seriesId } });
      return NextResponse.json({ ok: true });
    }
    case "publish": {
      const owns = await prisma.series.findFirst({ where: { id: data.seriesId, churchId } });
      if (!owns) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const series = await prisma.series.update({ where: { id: data.seriesId }, data: { published: !!data.published } });
      return NextResponse.json({ series });
    }
    case "moderate": {
      const { kind, id, hidden } = data;
      if (kind === "reflection") { const r = await prisma.reflection.findFirst({ where: { id, day: { series: { churchId } } } }); if (!r) return NextResponse.json({ error: "forbidden" }, { status: 403 }); await prisma.reflection.update({ where: { id }, data: { hidden: !!hidden } }); }
      else if (kind === "prayer") { const p = await prisma.prayer.findFirst({ where: { id, user: { churchId } } }); if (!p) return NextResponse.json({ error: "forbidden" }, { status: 403 }); await prisma.prayer.update({ where: { id }, data: { hidden: !!hidden } }); }
      return NextResponse.json({ ok: true });
    }
    case "importSeries": {
      const parsed = parseSeriesMarkdown(String(data.markdown ?? ""));
      if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });
      const start = parsed.startDate ? new Date(parsed.startDate) : null;
      const series = await prisma.series.create({ data: { churchId, title: parsed.title, subtitle: parsed.subtitle, weekNumber: parsed.weekNumber, startDate: start } });
      const days = parsed.days.map((d, i) => ({
        seriesId: series.id, order: i + 1, title: d.title || `Day ${i + 1}`, passageRef: d.passageRef, passageText: d.passageText,
        passageRefsExtra: d.passageRefsExtra, pastorNote: d.pastorNote, teaching: d.teaching, reflectionQuestions: d.reflectionQuestions as any, prayerPrompt: d.prayerPrompt, pointsReward: d.pointsReward,
      }));
      if (days.length) await prisma.day.createMany({ data: days });
      return NextResponse.json({ series: { id: series.id, title: series.title }, daysCreated: days.length });
    }
    case "setRole": {
      const { userId, role } = data;
      if (!userId || (role !== "MEMBER" && role !== "ADMIN")) return NextResponse.json({ error: "bad request" }, { status: 400 });
      const target = await prisma.user.findFirst({ where: { id: userId, churchId }, select: { id: true, role: true } });
      if (!target) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      if (target.role === "OWNER") return NextResponse.json({ error: "cannot change the owner" }, { status: 403 });
      await prisma.user.update({ where: { id: userId }, data: { role } });
      return NextResponse.json({ ok: true });
    }
    case "setEmail": {
      const { userId } = data;
      const email = String(data.email ?? "").trim().toLowerCase();
      if (!userId || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "invalid email" }, { status: 400 });
      const target = await prisma.user.findFirst({ where: { id: userId, churchId }, select: { id: true, role: true } });
      if (!target) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      if (target.role === "OWNER" && target.id !== admin.id) return NextResponse.json({ error: "cannot change the owner's email" }, { status: 403 });
      const taken = await prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (taken && taken.id !== userId) return NextResponse.json({ error: "that email is already in use" }, { status: 409 });
      await prisma.user.update({ where: { id: userId }, data: { email, emailVerified: null } });
      return NextResponse.json({ ok: true });
    }
    case "removeMember": {
      const { userId } = data;
      if (!userId || userId === admin.id) return NextResponse.json({ error: "bad request" }, { status: 400 });
      const target = await prisma.user.findFirst({ where: { id: userId, churchId }, select: { id: true, role: true } });
      if (!target) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      if (target.role === "OWNER") return NextResponse.json({ error: "cannot remove the owner" }, { status: 403 });
      await prisma.user.delete({ where: { id: userId } });
      return NextResponse.json({ ok: true });
    }
    default: return NextResponse.json({ error: "unknown action" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin || !admin.churchId) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); const id = searchParams.get("id");
  if (type === "day" && id) {
    const day = await prisma.day.findFirst({ where: { id, series: { churchId: admin.churchId } } });
    if (!day) return NextResponse.json({ error: "forbidden" }, { status: 403 });
    await prisma.day.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "bad request" }, { status: 400 });
}
