"use client";
import { useState } from "react";

type Row = { id: string; name: string; isMe: boolean; streak: number; stars: number; daysCompleted: number };
type SortKey = "stars" | "streak" | "daysCompleted";
const SORTS: { key: SortKey; label: string; icon: string; unit: string }[] = [
  { key: "stars", label: "Stars", icon: "ti-star", unit: "" },
  { key: "streak", label: "Streak", icon: "ti-flame", unit: "d" },
  { key: "daysCompleted", label: "Days", icon: "ti-check", unit: "" },
];

function fmtAgo(iso: string | null): string {
  if (!iso) return "not yet";
  const diff = Date.now() - Date.parse(iso);
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function Community({ churchName, initialRows = [], initialActivity = [] }: { churchName: string; initialRows?: Row[]; initialActivity?: any[] }) {
  const rows = initialRows;
  const [sort, setSort] = useState<SortKey>("stars");
  const sorted = [...rows].sort((a, b) => b[sort] - a[sort]);
  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><i className="ti ti-users" /> {churchName}</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 6 }}>Community</h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 18, lineHeight: 1.5 }}>A gentle encouragement to keep showing up — not a competition. Walk your own pace.</p>
      <div style={{ display: "flex", gap: 6, background: "var(--glassBg)", borderRadius: 12, padding: 4, marginBottom: 18 }}>
        {SORTS.map((s) => (<button key={s.key} onClick={() => setSort(s.key)} style={{ flex: 1, border: "none", background: sort === s.key ? "#fff" : "transparent", color: sort === s.key ? "var(--ink)" : "var(--muted)", fontSize: 13, fontWeight: 500, padding: 9, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}><i className={`ti ${s.icon}`} /> {s.label}</button>))}
      </div>
      {sorted.length === 0 && <div className="glass" style={{ borderRadius: 16, padding: 24, textAlign: "center", color: "var(--muted)" }}>No one's on the board yet.</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((r, i) => {
          const val = r[sort]; const unit = SORTS.find((s) => s.key === sort)!.unit;
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14, background: r.isMe ? "var(--glassBg)" : "transparent", border: `1px solid ${r.isMe ? "var(--accent)" : "var(--line)"}` }}>
              <div style={{ width: 24, textAlign: "center", fontSize: 14, fontWeight: 600, color: i < 3 ? "var(--accent)" : "var(--muted)" }}>{i + 1}</div>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500, flex: "none" }}>{r.name.slice(0, 1).toUpperCase()}</div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: r.isMe ? 600 : 500 }}>{r.name}{r.isMe && <span style={{ color: "var(--accent)", fontWeight: 400, fontSize: 13 }}> · you</span>}</div>
              <div style={{ fontSize: 17, fontWeight: 600, color: "var(--accent)" }}>{val}{unit}</div>
            </div>
          );
        })}
      </div>

      {initialActivity.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div className="label" style={{ marginBottom: 12 }}>Last active</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {initialActivity.map((u) => (
              <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 12, background: u.isMe ? "var(--glassBg)" : "transparent", border: `1px solid ${u.isMe ? "var(--accent)" : "transparent"}` }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500, flex: "none" }}>{u.name.slice(0, 1).toUpperCase()}</div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: u.isMe ? 600 : 500 }}>{u.name}{u.isMe && <span style={{ color: "var(--accent)", fontWeight: 400, fontSize: 12 }}> · you</span>}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{fmtAgo(u.lastActiveAt)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
