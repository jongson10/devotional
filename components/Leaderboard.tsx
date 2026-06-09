"use client";
import { useState } from "react";
import Link from "next/link";

type Row = { id: string; name: string; isMe: boolean; streak: number; stars: number; daysCompleted: number };
type SortKey = "stars" | "streak" | "daysCompleted";

const SORTS: { key: SortKey; label: string; icon: string; unit: string }[] = [
  { key: "stars", label: "Stars", icon: "ti-star", unit: "" },
  { key: "streak", label: "Streak", icon: "ti-flame", unit: "d" },
  { key: "daysCompleted", label: "Days", icon: "ti-check", unit: "" },
];

export default function Leaderboard({ initialRows = [] }: { initialRows?: Row[] }) {
  const rows = initialRows;
  const [sort, setSort] = useState<SortKey>("stars");

  const sorted = [...rows].sort((a, b) => b[sort] - a[sort]);

  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><i className="ti ti-trophy" /> Your church</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>Leaderboard</h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18, lineHeight: 1.5 }}>A gentle nudge to keep showing up — not a competition. Walk your own pace.</p>

      <div style={{ display: "flex", gap: 6, background: "var(--glassBg)", borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {SORTS.map((s) => (
          <button key={s.key} onClick={() => setSort(s.key)} style={{ flex: 1, border: "none", background: sort === s.key ? "#fff" : "transparent", color: sort === s.key ? "var(--ink)" : "var(--muted)", fontSize: 13, fontWeight: 500, padding: 9, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
            <i className={`ti ${s.icon}`} /> {s.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 && <div className="glass" style={{ borderRadius: 16, padding: 24, textAlign: "center", color: "var(--muted)" }}>No one's on the board yet.</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((r, i) => {
          const val = r[sort];
          const unit = SORTS.find((s) => s.key === sort)!.unit;
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: r.isMe ? "var(--glassBg)" : "transparent", border: `1px solid ${r.isMe ? "var(--accent)" : "var(--line)"}` }}>
              <div style={{ width: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: i < 3 ? "var(--accent)" : "var(--muted)" }}>{i + 1}</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flex: "none" }}>
                {r.name.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: r.isMe ? 600 : 500 }}>{r.name}{r.isMe && <span style={{ color: "var(--accent)", fontWeight: 400, fontSize: 13 }}> · you</span>}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--accent)" }}>{val}{unit}</div>
            </div>
          );
        })}
      </div>

      <Link href="/" style={{ display: "block", textAlign: "center", marginTop: 22, fontSize: 13, color: "var(--muted)" }}>Back to home</Link>
    </div>
  );
}
