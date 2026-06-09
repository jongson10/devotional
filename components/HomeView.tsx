"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";

type DayStatus = "open" | "future" | "missed" | "always";
type Day = { id: string; order: number; title: string; passageRef: string; pointsReward: number; done: boolean; lateDone: boolean; status: DayStatus; openable: boolean; unlocksOn: string | null; };

export default function HomeView({ name, churchName, seriesTitle, days, todayCard, streak, points }: { name: string; churchName: string; seriesTitle: string | null; days: Day[]; todayCard: Day | null; streak: number; points: number; }) {
  const { resolved } = useTheme();
  const router = useRouter();
  const [displayName, setDisplayName] = useState(name);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const greeting = resolved === "dawn" ? "Good morning," : "Good evening,";
  const doneCount = days.filter((d) => d.done).length;
  const LATE = "#4F9D69";

  async function saveName() {
    const clean = draftName.trim();
    if (!clean || clean === displayName) { setEditing(false); return; }
    setDisplayName(clean); setEditing(false);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: clean }) });
    router.refresh();
  }

  return (
    <div style={{ padding: "26px 18px" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 28 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{greeting}</div>
          {editing ? (
            <input autoFocus value={draftName} onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setDraftName(displayName); setEditing(false); } }} onBlur={saveName}
              style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", borderBottom: "2px solid var(--accent)", paddingBottom: 2, maxWidth: "100%" }} />
          ) : (
            <button onClick={() => { setDraftName(displayName); setEditing(true); }} style={{ background: "none", border: "none", padding: 0, display: "flex", alignItems: "center", gap: 7, color: "var(--ink)", maxWidth: "100%" }}>
              <span style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName}</span>
              <i className="ti ti-pencil" style={{ fontSize: 14, color: "var(--muted)", flex: "none" }} />
            </button>
          )}
        </div>
        <div style={{ display: "flex", gap: 18, flex: "none" }}>
          <Hero icon="ti-flame" value={streak} label="streak" />
          <Hero icon="ti-star" value={points} label="stars" />
        </div>
      </header>

      {days.length > 0 && (
        <div className="glass" style={{ borderRadius: 14, padding: "12px 14px", marginBottom: 26, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}><div style={{ height: 6, background: "var(--line)", borderRadius: 99, overflow: "hidden" }}><div style={{ width: `${(doneCount / Math.max(1, days.length)) * 100}%`, height: "100%", background: "var(--accent)", borderRadius: 99 }} /></div></div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>{doneCount} / {days.length}</div>
        </div>
      )}

      <div className="label" style={{ marginBottom: 12 }}>{seriesTitle ?? "No series yet"}</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {days.map((d) => {
          const isTodayCard = todayCard?.id === d.id;
          if (isTodayCard) {
            return (
              <Link key={d.id} href={`/today?dayId=${d.id}`} style={{ background: "var(--dark)", borderRadius: 18, padding: "16px 17px", color: "#fff" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--darkSub)" }}>Day {d.order} · today</span>
                  <span style={{ fontSize: 11, color: "var(--darkSub)" }}><i className="ti ti-star" /> +{d.pointsReward}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>{d.title}</div>
                <div style={{ fontSize: 13, color: "var(--darkSub)", marginBottom: 13 }}>{d.passageRef}</div>
                <div style={{ background: d.done ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.95)", color: d.done ? "#fff" : "var(--dark)", borderRadius: 11, padding: 11, textAlign: "center", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {d.done ? <><i className="ti ti-circle-check" /> Completed</> : <>Begin <i className="ti ti-arrow-right" /></>}
                </div>
              </Link>
            );
          }
          const locked = !d.openable && !d.done;
          const isFuture = d.status === "future" && !d.done;
          const dotColor = d.done ? (d.lateDone ? LATE : "var(--accent)") : "transparent";
          const sub = d.done ? (d.lateDone ? "Completed late" : d.passageRef) : isFuture && d.unlocksOn ? `Opens ${new Date(d.unlocksOn).toLocaleDateString(undefined, { month: "short", day: "numeric" })}` : d.passageRef;
          const inner = (
            <>
              <div style={{ width: 30, height: 30, flex: "none", borderRadius: "50%", background: dotColor, border: d.done ? "none" : "1.5px solid var(--line)", color: d.done ? "#fff" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>
                {d.done ? <i className="ti ti-check" /> : d.order}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, color: d.done ? "var(--ink)" : "var(--muted)" }}>{d.title}</div>
                <div style={{ fontSize: 12, color: d.lateDone ? LATE : "var(--muted)" }}>{sub}</div>
              </div>
              <i className={`ti ${d.done ? "ti-chevron-right" : locked ? "ti-lock" : "ti-chevron-right"}`} style={{ color: "var(--muted)" }} />
            </>
          );
          const style: React.CSSProperties = { borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 13, opacity: locked ? 0.55 : 1 };
          return (d.openable || d.done) ? <Link key={d.id} href={`/today?dayId=${d.id}`} className="glass" style={style}>{inner}</Link> : <div key={d.id} className="glass" style={style}>{inner}</div>;
        })}
        {days.length === 0 && (<div className="glass" style={{ borderRadius: 18, padding: 20, textAlign: "center", color: "var(--muted)" }}>No devotional available yet.</div>)}
      </div>
    </div>
  );
}

function Hero({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: "var(--accent)", fontSize: 22, fontWeight: 600, lineHeight: 1 }}><i className={`ti ${icon}`} style={{ fontSize: 18 }} /> {value}</div>
      <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
    </div>
  );
}
