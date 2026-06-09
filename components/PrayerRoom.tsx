"use client";
import { useEffect, useState } from "react";
export default function PrayerRoom() {
  const [prayers, setPrayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch("/api/prayers?room=1").then((r) => r.json()).then((j) => { setPrayers(j.prayers ?? []); setLoading(false); }); }, []);
  async function pray(id: string) { await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "PRAYING", prayerId: id }) }); }
  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><i className="ti ti-users" /> Your church</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 20 }}>Prayer room</h1>
      {loading && <div style={{ color: "var(--muted)" }}>Loading…</div>}
      {!loading && prayers.length === 0 && (<div className="glass" style={{ borderRadius: 16, padding: 24, textAlign: "center", color: "var(--muted)" }}>The prayer room is quiet right now. When someone shares a prayer, it appears here for the church to pray over.</div>)}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {prayers.map((p) => {
          const initials = p.author === "Anonymous" ? "?" : p.author.split(" ").map((s: string) => s[0]).slice(0, 2).join("");
          return (
            <div key={p.id} className="rise" style={{ background: "var(--glassBg)", border: `1px solid ${p.isMine ? "var(--accent)" : "var(--line)"}`, borderRadius: 16, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>{initials}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.author}{p.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--body)", marginBottom: 12 }}>{p.body}</div>
              <PrayBtn count={p.praying} on={p.iPrayed} onClick={() => pray(p.id)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
function PrayBtn({ count, on, onClick }: { count: number; on: boolean; onClick: () => void }) {
  const [active, setActive] = useState(on);
  const [c, setC] = useState(count);
  return (
    <button onClick={() => { setActive(!active); setC(c + (active ? -1 : 1)); onClick(); }}
      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 11px", borderRadius: 99, border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, background: active ? "var(--glassBg)" : "transparent", color: active ? "var(--accent)" : "var(--body)" }}>
      <i className="ti ti-hand-stop" /> Praying <span>{c}</span>
    </button>
  );
}
