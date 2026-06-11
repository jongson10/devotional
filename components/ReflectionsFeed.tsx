"use client";
import PostThread from "./Thread";
import { Avatar } from "./Avatar";

export default function ReflectionsFeed({ churchName, initial = [] }: { churchName: string; initial?: any[] }) {
  const threads = initial;
  return (
    <div style={{ padding: "30px 20px" }}>
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
        <Avatar name={p.author} image={p.image} size={34} />
        {!last && <div style={{ width: 2, flex: 1, background: "var(--line)", marginTop: 4, minHeight: 8 }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingBottom: last ? 4 : 20 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{p.author}{p.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
        <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--body)", margin: "3px 0 5px" }}>{p.body}</div>
        <PostThread target={{ reflectionId: p.id }} amen={{ count: p.amen, on: p.iReacted?.amen }} praying={{ count: p.praying, on: p.iReacted?.praying }} comments={p.comments} />
      </div>
    </div>
  );
}
