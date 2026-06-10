"use client";
import Thread, { ReactionButton } from "./Thread";

const initialsOf = (a: string) => (a === "Anonymous" ? "?" : a.split(" ").map((s) => s[0]).slice(0, 2).join(""));

export default function ReflectionsFeed({ churchName, initial = [] }: { churchName: string; initial?: any[] }) {
  const threads = initial;
  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><i className="ti ti-users" /> {churchName}</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 22 }}>Reflections</h1>
      {threads.length === 0 && (<div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>No reflections yet. As people work through the devotional, their reflections appear here.</div>)}
      {threads.map((t: any) => (
        <div key={t.key} style={{ marginBottom: 30 }}>
          <div className="label" style={{ marginBottom: 3 }}>{t.seriesTitle} · Day {t.dayOrder}</div>
          <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 16 }}>{t.dayTitle}</div>
          {t.posts.map((p: any, i: number) => <Post key={p.id} p={p} last={i === t.posts.length - 1} />)}
        </div>
      ))}
    </div>
  );
}

function Post({ p, last }: { p: any; last: boolean }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "none" }}>
        <div style={{ width: 34, height: 34, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>{initialsOf(p.author)}</div>
        {!last && <div style={{ width: 2, flex: 1, background: "var(--line)", marginTop: 4, minHeight: 8 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 4 : 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.author}{p.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--body)", margin: "3px 0 5px" }}>{p.body}</div>
        <div style={{ display: "flex", gap: 4, marginLeft: -6 }}>
          <ReactionButton icon="ti-flame" type="AMEN" count={p.amen} on={p.iReacted?.amen} reflectionId={p.id} />
          <ReactionButton icon="ti-hand-stop" type="PRAYING" count={p.praying} on={p.iReacted?.praying} reflectionId={p.id} />
        </div>
        <Thread comments={p.comments} target={{ reflectionId: p.id }} />
      </div>
    </div>
  );
}
