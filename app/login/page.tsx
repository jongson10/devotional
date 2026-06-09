"use client";
import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
function LoginInner() {
  const params = useSearchParams();
  const check = params.get("check");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit() {
    const e = email.trim(); if (!e || !e.includes("@")) return;
    setBusy(true);
    await signIn("nodemailer", { email: e, redirect: false, callbackUrl: "/" });
    setBusy(false); setSent(true);
  }
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: 16, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 18 }}><i className="ti ti-sunrise" /></div>
        <h1 style={{ fontSize: 27, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.15 }}>Daily Devotional</h1>
        <p style={{ fontSize: 15, color: "var(--muted)", marginTop: 8, lineHeight: 1.5 }}>Walk through Sunday's message, one day at a time.</p>
      </div>
      {sent || check ? (
        <div className="glass" style={{ borderRadius: 16, padding: 20, fontSize: 14, lineHeight: 1.6, color: "var(--body)" }}>
          <i className="ti ti-mail" style={{ color: "var(--accent)", fontSize: 20 }} />
          <div style={{ marginTop: 8 }}>Check your email for a sign-in link. You can close this tab.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="glass" style={{ borderRadius: 14, padding: "12px 16px" }}>
            <input type="email" placeholder="you@email.com" value={email} autoComplete="email" onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") submit(); }} style={{ fontSize: 15 }} />
          </div>
          <button className="btn-primary" onClick={submit} disabled={busy}>{busy ? "Sending…" : <>Send me a sign-in link <i className="ti ti-arrow-right" /></>}</button>
          <p style={{ fontSize: 12, color: "var(--muted)", textAlign: "center", marginTop: 4 }}>No password needed. We'll email you a secure link.</p>
        </div>
      )}
    </div>
  );
}
export default function LoginPage() { return <Suspense><LoginInner /></Suspense>; }
