"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Target = { reflectionId?: string; prayerId?: string };
type Reply = { id: string; author: string; isMine: boolean; body: string; amen: number; praying: number; iReacted: { amen: boolean; praying: boolean } };

const initialsOf = (a: string) => (a === "Anonymous" ? "?" : a.split(" ").map((s) => s[0]).slice(0, 2).join(""));

// Borderless reaction button — shared by posts (reflection/prayer) and replies (comment).
export function ReactionButton({ icon, type, count, on, reflectionId, prayerId, commentId }: { icon: string; type: "AMEN" | "PRAYING"; count: number; on?: boolean; reflectionId?: string; prayerId?: string; commentId?: string }) {
  const [active, setActive] = useState(!!on);
  const [c, setC] = useState(count);
  async function toggle() {
    setActive(!active); setC(c + (active ? -1 : 1));
    try { await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, reflectionId, prayerId, commentId }) }); } catch {}
  }
  return (
    <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "4px 6px", background: "none", border: "none", color: active ? "var(--accent)" : "var(--muted)" }}>
      <i className={`ti ${icon}`} />{c > 0 ? ` ${c}` : ""}
    </button>
  );
}

// One-level replies under a post, with a composer.
export default function Thread({ comments = [], target }: { comments?: Reply[]; target: Target }) {
  const [composing, setComposing] = useState(false);
  return (
    <div>
      {comments.map((r) => (
        <div key={r.id} style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <div style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{initialsOf(r.author)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{r.author}{r.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)", margin: "1px 0 3px" }}>{r.body}</div>
            <div style={{ display: "flex", gap: 4 }}>
              <ReactionButton icon="ti-flame" type="AMEN" count={r.amen} on={r.iReacted.amen} commentId={r.id} />
              <ReactionButton icon="ti-hand-stop" type="PRAYING" count={r.praying} on={r.iReacted.praying} commentId={r.id} />
            </div>
          </div>
        </div>
      ))}
      {composing
        ? <Composer target={target} onDone={() => setComposing(false)} />
        : <button onClick={() => setComposing(true)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, padding: "8px 0 2px", display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-message-circle" /> Reply</button>}
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
