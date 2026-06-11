"use client";
import Link from "next/link";
import { useTheme } from "./ThemeProvider";

type DayStatus = "open" | "future" | "missed" | "always";
type Day = { id: string; order: number; title: string; passageRef: string; pointsReward: number; done: boolean; lateDone: boolean; status: DayStatus; openable: boolean; unlocksOn: string | null; };
type SeriesData = { id: string; title: string; subtitle: string | null; weekNumber: number | null; days: Day[]; todayCardId: string | null };

const LATE = "var(--sage)";

export default function HomeView({ name, churchName, seriesList, streak, points }: { name: string; churchName: string; seriesList: SeriesData[]; streak: number; points: number; }) {
  const { resolved } = useTheme();
  const greeting = resolved === "dawn" ? "Good morning," : "Good evening,";

  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}><i className="ti ti-building-church" /> {churchName}</div>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 26 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>{greeting}</div>
          <div style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
        </div>
        <div style={{ display: "flex", gap: 14, flex: "none" }}>
          <Hero icon="ti-flame" value={streak} label="Current streak" />
          <Hero icon="ti-star" value={points} label="Stars earned" />
        </div>
      </header>

      {seriesList.length === 0 && (<div className="glass" style={{ borderRadius: 18, padding: 20, textAlign: "center", color: "var(--muted)" }}>No devotional available yet.</div>)}
      {seriesList.map((s) => <SeriesSection key={s.id} series={s} />)}
    </div>
  );
}

function SeriesSection({ series }: { series: SeriesData }) {
  const doneCount = series.days.filter((d) => d.done).length;
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
        <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em", flex: 1, minWidth: 0 }}>{series.title}</div>
        {series.days.length > 0 && <div style={{ fontSize: 11, color: "var(--muted)", flex: "none" }}>{doneCount} of {series.days.length} complete</div>}
      </div>
      {(series.subtitle || series.weekNumber) && <div className="label" style={{ marginBottom: 10 }}>{series.weekNumber ? `Week ${series.weekNumber}` : ""}{series.weekNumber && series.subtitle ? " · " : ""}{series.subtitle ?? ""}</div>}
      {!series.subtitle && !series.weekNumber && <div style={{ marginBottom: 10 }} />}
      {series.days.length > 0 && (
        <div role="progressbar" aria-valuemin={0} aria-valuemax={series.days.length} aria-valuenow={doneCount} aria-label={`${series.title} progress`} style={{ height: 3, background: "var(--line)", borderRadius: 2, marginBottom: 10 }}>
          <div style={{ width: `${Math.round((doneCount / series.days.length) * 100)}%`, height: 3, background: "var(--accent)", borderRadius: 2, transition: "width .4s ease" }} />
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column" }}>
        {series.days.map((d) => {
          const isTodayCard = series.todayCardId === d.id;
          if (isTodayCard) {
            return (
              <Link key={d.id} href={`/today?dayId=${d.id}`} style={{ background: "var(--parchment)", border: "1px solid var(--parchmentBorder)", borderRadius: 16, padding: "16px 17px", color: "var(--ink)", marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 600 }}>Day {d.order} · today</span>
                  <span style={{ fontSize: 11, color: "var(--muted)" }}><i className="ti ti-star" aria-hidden="true" /> +{d.pointsReward}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 3 }}>{d.title}</div>
                <div style={{ fontSize: 13, color: "var(--soft)", marginBottom: 14 }}>{d.passageRef}</div>
                <div style={{ background: d.done ? "var(--chip)" : "var(--accent)", color: d.done ? "var(--soft)" : "var(--onAccent)", borderRadius: 11, padding: 11, textAlign: "center", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  {d.done ? <><i className="ti ti-circle-check" aria-hidden="true" /> Completed</> : <>Begin <i className="ti ti-arrow-right" aria-hidden="true" /></>}
                </div>
              </Link>
            );
          }
          const locked = !d.openable && !d.done;
          const isFuture = d.status === "future" && !d.done;
          const sub = d.done ? (d.lateDone ? "Completed late" : d.passageRef) : isFuture && d.unlocksOn ? `Opens ${new Date(d.unlocksOn).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}` : d.passageRef;
          const inner = (
            <>
              <div style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", background: d.done ? "var(--sageBg)" : "transparent", border: d.done ? "none" : "1.5px solid var(--line)", color: d.done ? "var(--sage)" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>
                {d.done ? <i className="ti ti-check" aria-hidden="true" /> : d.order}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: d.done ? "var(--ink)" : "var(--muted)" }}>{d.title}</div>
                <div style={{ fontSize: 12, color: d.lateDone ? LATE : "var(--muted)" }}>{sub}</div>
              </div>
              <i className={`ti ${locked ? "ti-lock" : "ti-chevron-right"}`} style={{ color: "var(--muted)", opacity: 0.6 }} aria-hidden="true" />
            </>
          );
          const style: React.CSSProperties = { borderBottom: "1px solid var(--line)", padding: "12px 2px", display: "flex", alignItems: "center", gap: 11, opacity: locked ? 0.55 : 1 };
          return (d.openable || d.done) ? <Link key={d.id} href={`/today?dayId=${d.id}`} style={style}>{inner}</Link> : <div key={d.id} aria-disabled="true" style={style}>{inner}</div>;
        })}
        {series.days.length === 0 && (<div className="glass" style={{ borderRadius: 18, padding: 18, textAlign: "center", color: "var(--muted)", fontSize: 13 }}>No days yet.</div>)}
      </div>
    </div>
  );
}

function Hero({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div aria-label={`${label}: ${value}`} style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--accent)", fontSize: 18, fontWeight: 600, lineHeight: 1 }}>
      <i className={`ti ${icon}`} style={{ fontSize: 16 }} aria-hidden="true" /> {value}
    </div>
  );
}
