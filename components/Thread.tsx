"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PrayerHands } from "./Avatar";

type Target = { reflectionId?: string; prayerId?: string };
type Reply = { id: string; author: string; isMine: boolean; body: string; amen: number; praying: number; iReacted: { amen: boolean; praying: boolean } };

// Borderless reaction button — shared by posts (reflection/prayer) and replies (comment).
function ReactionButton({ type, count, on, reflectionId, prayerId, commentId }: { type: "AMEN" | "PRAYING"; count: number; on?: boolean; reflectionId?: string; prayerId?: string; commentId?: string }) {
  const [active, setActive] = useState(!!on);
  const [c, setC] = useState(count);
  async function toggle() {
    setActive(!active); setC(c + (active ? -1 : 1));
    try { await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, reflectionId, prayerId, commentId }) }); } catch {}
  }
  return (
    <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 6px", background: "none", border: "none", color: active ? "var(--accent)" : "var(--muted)" }}>
      {type === "PRAYING"
        ? <PrayerHands size={14} />
        : <svg width="14" height="14" viewBox="0 0 24 24" fill={c > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" style={{ verticalAlign: "-2px" }} aria-hidden="true"><path d="M12 21l-1.45-1.32C5.4 14.99 2 11.9 2 8.05 2 5.27 4.2 3 7 3c1.74 0 3.41.81 4.5 2.09C12.59 3.81 14.26 3 16 3c2.8 0 5 2.27 5 5.05 0 3.85-3.4 6.94-8.55 11.63L12 21z" /></svg>}
      <span>{type === "PRAYING" ? "Praying" : "Amen"}</span>{c > 0 ? <span style={{ marginLeft: 1 }}>{c}</span> : null}
    </button>
  );
}

// Action bar (Amen / Praying / Reply inline) + flat one-level replies (no indent) + composer.
export default function PostThread({ target, amen, praying, comments = [] }: { target: Target; amen?: { count: number; on?: boolean }; praying: { count: number; on?: boolean }; comments?: Reply[] }) {
  const [composing, setComposing] = useState(false);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: -6 }}>
        {amen && <ReactionButton type="AMEN" count={amen.count} on={amen.on} reflectionId={target.reflectionId} prayerId={target.prayerId} />}
        <ReactionButton type="PRAYING" count={praying.count} on={praying.on} reflectionId={target.reflectionId} prayerId={target.prayerId} />
        <button onClick={() => setComposing((v) => !v)} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 6px", background: "none", border: "none", color: "var(--muted)" }}>
          <i className="ti ti-message-circle" /> Reply
        </button>
      </div>
      {comments.length > 0 && <div style={{ marginTop: 4 }}>{comments.map((r) => <ReplyRow key={r.id} r={r} />)}</div>}
      {composing && <Composer target={target} onDone={() => setComposing(false)} />}
    </div>
  );
}

function ReplyRow({ r }: { r: Reply }) {
  const router = useRouter();
  async function del() {
    if (!confirm("Delete this reply?")) return;
    try { await fetch(`/api/comments?id=${r.id}`, { method: "DELETE" }); } catch {}
    router.refresh();
  }
  return (
    <div style={{ paddingTop: 10, marginTop: 10, borderTop: "1px solid var(--line)" }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{r.author}{r.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)", margin: "2px 0 4px" }}>{r.body}</div>
      <div style={{ display: "flex", gap: 2, alignItems: "center", marginLeft: -6 }}>
        <ReactionButton type="AMEN" count={r.amen} on={r.iReacted.amen} commentId={r.id} />
        <ReactionButton type="PRAYING" count={r.praying} on={r.iReacted.praying} commentId={r.id} />
        {r.isMine && <button onClick={del} aria-label="Delete reply" style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, padding: "4px 6px" }}><i className="ti ti-trash" /></button>}
      </div>
    </div>
  );
}

function Composer({ target, onDone }: { target: Target; onDone: () => void }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try { await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, parentId: null, body }) }); } catch {}
    setDraft(""); setBusy(false); onDone(); router.refresh();
  }
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 8 }}>
      <textarea autoFocus rows={1} value={draft} placeholder="Reply…" onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        style={{ flex: 1, resize: "none", fontSize: 14, lineHeight: 1.45, padding: "8px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--glassBg)", minHeight: 20, maxHeight: 120 }} />
      <button onClick={send} disabled={!draft.trim() || busy} aria-label="Send reply" style={{ width: 32, height: 32, flex: "none", border: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: draft.trim() && !busy ? 1 : 0.5 }}><i className="ti ti-arrow-up" /></button>
    </div>
  );
}
