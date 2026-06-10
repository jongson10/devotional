"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Target = { reflectionId?: string; prayerId?: string };
type Node = { id: string; author: string; isMine: boolean; body: string; amen: number; praying: number; iReacted: { amen: boolean; praying: boolean }; replies: Node[] };

export default function Thread({ comments = [], target }: { comments?: Node[]; target: Target }) {
  const [composing, setComposing] = useState(false);
  return (
    <div style={{ marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
      {comments.map((c) => <CommentItem key={c.id} c={c} target={target} />)}
      {composing ? (
        <Composer target={target} parentId={null} placeholder="Add a reply…" onDone={() => setComposing(false)} autoFocus />
      ) : (
        <button onClick={() => setComposing(true)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, padding: "4px 0", display: "flex", alignItems: "center", gap: 5 }}>
          <i className="ti ti-message-circle" /> {comments.length > 0 ? "Add a reply" : "Reply"}
        </button>
      )}
    </div>
  );
}

function CommentItem({ c, target }: { c: Node; target: Target }) {
  const [replying, setReplying] = useState(false);
  const initials = c.author === "Anonymous" ? "?" : c.author.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ width: 26, height: 26, flex: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 500 }}>{initials}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.author}{c.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
          <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)", margin: "2px 0 5px" }}>{c.body}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Pill icon="ti-flame" type="AMEN" count={c.amen} on={c.iReacted.amen} commentId={c.id} />
            <Pill icon="ti-hand-stop" type="PRAYING" count={c.praying} on={c.iReacted.praying} commentId={c.id} />
            <button onClick={() => setReplying(!replying)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, padding: "4px 6px" }}>Reply</button>
          </div>
          {replying && <Composer target={target} parentId={c.id} placeholder={`Reply to ${c.author}…`} onDone={() => setReplying(false)} autoFocus />}
        </div>
      </div>
      {c.replies.length > 0 && (
        <div style={{ marginLeft: 13, paddingLeft: 11, borderLeft: "2px solid var(--line)", marginTop: 8 }}>
          {c.replies.map((r) => <CommentItem key={r.id} c={r} target={target} />)}
        </div>
      )}
    </div>
  );
}

function Composer({ target, parentId, placeholder, onDone, autoFocus }: { target: Target; parentId: string | null; placeholder: string; onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  async function send() {
    const body = draft.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      await fetch("/api/comments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...target, parentId, body }) });
    } catch {}
    setDraft(""); setBusy(false); onDone?.(); router.refresh();
  }
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, marginTop: 6 }}>
      <textarea autoFocus={autoFocus} rows={1} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
        style={{ flex: 1, resize: "none", fontSize: 14, lineHeight: 1.45, padding: "8px 12px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--glassBg)", minHeight: 20, maxHeight: 120 }} />
      <button onClick={send} disabled={!draft.trim() || busy} aria-label="Send reply" style={{ width: 34, height: 34, flex: "none", border: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", opacity: draft.trim() && !busy ? 1 : 0.5 }}><i className="ti ti-arrow-up" /></button>
    </div>
  );
}

function Pill({ icon, type, count, on, commentId }: { icon: string; type: "AMEN" | "PRAYING"; count: number; on: boolean; commentId: string }) {
  const [active, setActive] = useState(on);
  const [c, setC] = useState(count);
  async function toggle() {
    setActive(!active); setC(c + (active ? -1 : 1));
    try { await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, commentId }) }); } catch {}
  }
  return (
    <button onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, padding: "4px 9px", borderRadius: 99, border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, background: active ? "var(--glassBg)" : "transparent", color: active ? "var(--accent)" : "var(--muted)" }}>
      <i className={`ti ${icon}`} /> {c > 0 ? c : ""}
    </button>
  );
}
