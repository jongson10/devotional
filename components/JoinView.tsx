"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinView({ initialCode = "", invalid = false }: { initialCode?: string; invalid?: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState(initialCode);
  const [err, setErr] = useState<string | null>(invalid ? "No church found with that code. Check it and try again." : null);
  const [busy, setBusy] = useState(false);
  async function submit() {
    const c = code.trim().toUpperCase(); if (!c) return;
    setBusy(true); setErr(null);
    const r = await fetch("/api/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: c }) });
    const j = await r.json();
    setBusy(false);
    if (j.error) { setErr(j.error); return; }
    router.push("/"); router.refresh();
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--accent)", color: "var(--onAccent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18 }}><i className="ti ti-building-church" /></div>
        <h1 style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Join your church</h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>Enter the code your church shared with you to see its devotionals.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="glass" style={{ borderRadius: 14, padding: "12px 16px" }}>
          <input placeholder="Church code, e.g. MVCEM" value={code} autoFocus autoCapitalize="characters" autoCorrect="off" onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} style={{ fontSize: 16, letterSpacing: "0.08em" }} />
        </div>
        <button className="btn-primary" onClick={submit} disabled={busy || !code.trim()}>{busy ? "Joining…" : <>Join <i className="ti ti-arrow-right" /></>}</button>
        {err && <p style={{ fontSize: 13, color: "#b4452f", textAlign: "center" }}>{err}</p>}
        <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>Don't have a code? Ask your church admin for one.</p>
      </div>
    </div>
  );
}
