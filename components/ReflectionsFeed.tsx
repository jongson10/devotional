"use client";
import { useEffect, useState } from "react";
export default function ReflectionsFeed({ churchName }: { churchName: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/reflections?feed=1").then((r) => r.json()).then((j) => { setItems(j.reflections ?? []); setLoading(false); }); }, []);
  async function react(type: "AMEN" | "PRAYING", id: string) { await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, reflectionId: id }) }); }
  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><i className="ti ti-users" /> {churchName}</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 20 }}>Reflections</h1>
      {loading && <div style={{ color: "var(--muted)" }}>Loading…</div>}
      {!loading && items.length === 0 && (<div className="glass" style={{ borderRadius: 16, padding: 24, textAlign: "center", color: "var(--muted)" }}>No reflections yet. As people work through the devotional, their reflections appear here.</div>)}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((p) => {
          const initials = p.author === "Anonymous" ? "?" : p.author.split(" ").map((s: string) => s[0]).slice(0, 2).join("");
          return (
            <div key={p.id} className="rise" style={{ background: "var(--glassBg)", border: `1px solid ${p.isMine ? "var(--accent)" : "var(--line)"}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>{initials}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.author}{p.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
                  {p.dayTitle && <div style={{ fontSize: 11, color: "var(--muted)" }}>Day {p.dayOrder} · {p.dayTitle}</div>}
                </div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--body)", marginBottom: 12 }}>{p.body}</div>
              <div style={{ display: "flex", gap: 8 }}>
                <FeedReact icon="ti-flame" label="Amen" count={p.amen} on={p.iReacted?.amen} onClick={() => react("AMEN", p.id)} />
                <FeedReact icon="ti-hand-stop" label="Praying" count={p.praying} on={p.iReacted?.praying} onClick={() => react("PRAYING", p.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
function FeedReact({ icon, label, count, on, onClick }: { icon: string; label: string; count: number; on?: boolean; onClick: () => void }) {
  const [active, setActive] = useState(!!on); const [c, setC] = useState(count);
  return (<button onClick={() => { setActive(!active); setC(c + (active ? -1 : 1)); onClick(); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 11px", borderRadius: 99, border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, background: active ? "var(--glassBg)" : "transparent", color: active ? "var(--accent)" : "var(--body)" }}><i className={`ti ${icon}`} /> {label} <span>{c}</span></button>);
}
