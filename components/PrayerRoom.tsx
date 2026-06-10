"use client";
import PostThread from "./Thread";

const initialsOf = (a: string) => (a === "Anonymous" ? "?" : a.split(" ").map((s) => s[0]).slice(0, 2).join(""));

export default function PrayerRoom({ churchName, initial = [] }: { churchName: string; initial?: any[] }) {
  const prayers = initial;
  return (
    <div style={{ padding: "26px 18px" }}>
      <div className="label" style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}><i className="ti ti-users" /> {churchName}</div>
      <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", marginBottom: 22 }}>Prayer room</h1>
      {prayers.length === 0 && (<div style={{ color: "var(--muted)", fontSize: 14, lineHeight: 1.6 }}>The prayer room is quiet right now. When someone shares a prayer, it appears here.</div>)}
      {prayers.map((p: any, i: number) => (
        <div key={p.id} style={{ display: "flex", gap: 10, paddingBottom: 18, marginBottom: 18, borderBottom: i === prayers.length - 1 ? "none" : "1px solid var(--line)" }}>
          <div style={{ width: 34, height: 34, flex: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 500 }}>{initialsOf(p.author)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.author}{p.isMine && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
            <div style={{ fontSize: 15, lineHeight: 1.55, color: "var(--body)", margin: "3px 0 5px" }}>{p.body}</div>
            <PostThread target={{ prayerId: p.id }} praying={{ count: p.praying, on: p.iPrayed }} comments={p.comments} />
          </div>
        </div>
      ))}
    </div>
  );
}
