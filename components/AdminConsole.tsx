"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "./Avatar";

type Tab = "content" | "members" | "activity" | "moderation" | "settings";

function fmtAgo(iso: string | null): string {
  if (!iso) return "never";
  const diff = Date.now() - Date.parse(iso);
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const TIMEZONES = [
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "UTC",
  "Europe/London", "Europe/Paris", "Asia/Seoul", "Asia/Tokyo", "Australia/Sydney",
];

export default function AdminConsole({ initialSeries = [], initialChurch = null }: { initialSeries?: any[]; initialChurch?: any }) {
  const [tab, setTab] = useState<Tab>("content");
  return (
    <div style={{ padding: "20px 18px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Admin</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Link href="/settings" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--accent)" }}><i className="ti ti-settings" /> Settings</Link>
          <Link href="/" style={{ fontSize: 13, color: "var(--accent)" }}>Back to app <i className="ti ti-arrow-right" /></Link>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, background: "var(--chip)", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {(["content", "members", "activity", "moderation", "settings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", background: tab === t ? "var(--glassBg)" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontSize: 12, fontWeight: 500, padding: "9px 4px", borderRadius: 9, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "content" && <ContentManager initialSeries={initialSeries} />}
      {tab === "members" && <Members />}
      {tab === "activity" && <Activity />}
      {tab === "moderation" && <Moderation />}
      {tab === "settings" && <Settings initialChurch={initialChurch} />}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "var(--glassBg)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, marginBottom: 14 }}>{children}</div>;
}
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>{label}</span>
      {children}
      {hint && <span style={{ display: "block", fontSize: 11, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>{hint}</span>}
    </label>
  );
}
const inputStyle: React.CSSProperties = { background: "var(--chip)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 14, width: "100%" };

function toDateInput(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "9px 0" }}>
      <span style={{ fontSize: 14, color: "var(--ink)" }}>{label}</span>
      <span style={{ width: 42, height: 24, borderRadius: 99, background: on ? "var(--accent)" : "var(--line)", position: "relative", transition: "background .2s", flex: "none" }}>
        <span style={{ position: "absolute", top: 3, left: on ? 21 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
      </span>
    </button>
  );
}

function Settings({ initialChurch = null }: { initialChurch?: any }) {
  const [tz, setTz] = useState<string>(initialChurch?.timezone ?? "America/Los_Angeles");
  const [name, setName] = useState<string>(initialChurch?.name ?? "");
  const [intro, setIntro] = useState<string>(initialChurch?.introText ?? "");
  const [refl, setRefl] = useState<boolean>(initialChurch?.reflectionFeedEnabled ?? true);
  const [pray, setPray] = useState<boolean>(initialChurch?.prayerRoomEnabled ?? true);
  const [comm, setComm] = useState<boolean>(initialChurch?.gamificationEnabled ?? true);
  const [bannerOn, setBannerOn] = useState<boolean>(initialChurch?.bannerEnabled ?? false);
  const [banner, setBanner] = useState<string>(initialChurch?.bannerText ?? "");
  const [saved, setSaved] = useState(false);
  async function save() {
    setSaved(false);
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveSettings", timezone: tz, name, introText: intro, reflectionFeedEnabled: refl, prayerRoomEnabled: pray, gamificationEnabled: comm, bannerEnabled: bannerOn, bannerText: banner }) });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  return (
    <>
    <Card>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Church settings</div>
      <Field label="Church name"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Church name" /></Field>
      <Field label="Time zone" hint="Used to decide which day's devotional is 'today'. Days unlock at midnight in this zone.">
        <select style={inputStyle} value={tz} onChange={(e) => setTz(e.target.value)}>
          {!TIMEZONES.includes(tz) && tz && <option value={tz}>{tz}</option>}
          {TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </Field>
      <Field label="Welcome intro (global)" hint="Shown before today's passage. Leave blank for the default; a series can override it.">
        <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={intro} onChange={(e) => setIntro(e.target.value)} placeholder="Begin by reading today's passage. Then we'll walk through the lesson, reflection, and a closing prayer." />
      </Field>
      <span className="label" style={{ display: "block", marginTop: 6, marginBottom: 2 }}>Home banner</span>
      <Toggle label="Show banner on home page" on={bannerOn} onChange={setBannerOn} />
      {bannerOn && (
        <Field label="Banner text" hint="Shown under the greeting, above the first series. Keep it short — announcements, a verse, a welcome.">
          <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={banner} onChange={(e) => setBanner(e.target.value)} maxLength={500} placeholder="e.g. Join us Wednesday 7pm for the mid-week prayer night." />
        </Field>
      )}
      <span className="label" style={{ display: "block", marginTop: 6, marginBottom: 2 }}>Tabs members can see</span>
      <Toggle label="Reflections" on={refl} onChange={setRefl} />
      <Toggle label="Prayer" on={pray} onChange={setPray} />
      <Toggle label="Community" on={comm} onChange={setComm} />
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={save}>Save settings</button>
      {saved && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, textAlign: "center" }}>Saved.</div>}
    </Card>
    <Maintenance />
    </>
  );
}

function Maintenance() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function run() {
    setBusy(true); setMsg(null);
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "reconcileProgress" }) });
    const j = await r.json(); setBusy(false);
    if (j.error) { setMsg(String(j.error)); return; }
    const lines = [
      `Checked ${j.checked} completed day${j.checked === 1 ? "" : "s"}; reset ${j.fixed}; rebuilt stats for ${j.rebuilt ?? 0} member${(j.rebuilt ?? 0) === 1 ? "" : "s"}.`,
      ...(j.results ?? []),
      ...(j.errors ?? []).map((e: string) => `⚠ ${e}`),
    ];
    setMsg(lines.join("\n"));
  }
  return (
    <Card>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Maintenance</div>
      <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
        Rechecks every completed day for all members and un-completes any that are missing their reflections or prayer, then rebuilds every member's streak and stars from their remaining completed days (fixes stale stats from older deletes or removed series).
      </p>
      <button className="btn-ghost" style={{ fontSize: 13, padding: "10px 14px" }} onClick={run} disabled={busy}>{busy ? "Checking…" : "Recheck completion marks"}</button>
      {msg && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, whiteSpace: "pre-line", lineHeight: 1.6 }}>{msg}</div>}
    </Card>
  );
}

function ContentManager({ initialSeries = [] }: { initialSeries?: any[] }) {
  const [series, setSeries] = useState<any[]>(initialSeries);
  const [editing, setEditing] = useState<any | null>(null);
  const [editingDay, setEditingDay] = useState<any | null>(null);
  const [importing, setImporting] = useState(false);
  function load() { fetch("/api/admin?view=series").then((r) => r.json()).then((j) => setSeries(j.series ?? [])); }
  async function saveSeries(s: any) {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveSeries", ...s }) });
    setEditing(null); load();
  }
  async function publish(id: string, published: boolean) {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "publish", seriesId: id, published }) });
    load();
  }
  async function saveDay(d: any) {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveDay", ...d }) });
    setEditingDay(null); load();
  }
  async function deleteDay(id: string) {
    await fetch(`/api/admin?type=day&id=${id}`, { method: "DELETE" });
    setEditingDay(null); load();
  }
  async function deleteSeries(id: string, title: string) {
    if (!confirm(`Delete the series "${title}"? This permanently removes it and all its days, reflections, and prayers. This can't be undone.`)) return;
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "deleteSeries", seriesId: id }) });
    load();
  }
  if (editingDay) return <DayEditor day={editingDay} onSave={saveDay} onCancel={() => setEditingDay(null)} onDelete={editingDay.id ? () => { if (confirm("Delete this day? This can't be undone.")) deleteDay(editingDay.id); } : undefined} />;
  if (editing) return <SeriesEditor editing={editing} onChange={setEditing} onSave={saveSeries} onCancel={() => setEditing(null)} />;
  if (importing) return <SeriesImporter onImported={() => { setImporting(false); load(); }} onCancel={() => setImporting(false)} />;
  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button className="btn-ghost" onClick={() => setEditing({ title: "", subtitle: "", weekNumber: series.length + 1, startDate: "", introText: "" })}><i className="ti ti-plus" /> New series</button>
        <button className="btn-ghost" onClick={() => setImporting(true)}><i className="ti ti-file-import" /> Import</button>
      </div>
      {series.map((s) => (
        <Card key={s.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.days.length} days · {s.published ? "Published" : "Draft"}{s.startDate ? ` · starts ${toDateInput(s.startDate)}` : " · no date lock"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEditing({ id: s.id, title: s.title, subtitle: s.subtitle, weekNumber: s.weekNumber, startDate: toDateInput(s.startDate), introText: s.introText ?? "" })} style={iconBtn}><i className="ti ti-edit" /></button>
              <button onClick={() => publish(s.id, !s.published)} style={{ ...iconBtn, color: s.published ? "var(--accent)" : "var(--muted)" }}><i className={`ti ${s.published ? "ti-eye" : "ti-eye-off"}`} /></button>
              <button onClick={() => deleteSeries(s.id, s.title)} style={{ ...iconBtn, color: "#b4452f" }} aria-label="Delete series"><i className="ti ti-trash" /></button>
            </div>
          </div>
          {s.days.map((d: any) => (
            <button key={d.id} onClick={() => setEditingDay({ ...d, seriesId: s.id })} style={{ width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 8, padding: 8, border: "1px solid var(--line)", borderRadius: 9, marginBottom: 6, background: "transparent", color: "var(--ink)" }}>
              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "var(--glassBg)", color: "var(--accent)", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center" }}>{d.order}</span>
              <span style={{ flex: 1, fontSize: 13 }}>{d.title}</span>
              <i className="ti ti-chevron-right" style={{ color: "var(--muted)" }} />
            </button>
          ))}
          <button className="btn-ghost" style={{ fontSize: 13, padding: 9, marginTop: 4 }} onClick={() => setEditingDay({ seriesId: s.id, order: s.days.length + 1, title: "", passageRef: "", passageText: "", teaching: "", reflectionQuestions: [""], prayerPrompt: "", pointsReward: 60 })}><i className="ti ti-plus" /> Add day</button>
        </Card>
      ))}
    </div>
  );
}

function SeriesImporter({ onImported, onCancel }: { onImported: () => void; onCancel: () => void }) {
  const [md, setMd] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setMd(String(r.result ?? "")); r.readAsText(f);
  }
  async function run() {
    setErr(null); setBusy(true);
    const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "importSeries", markdown: md }) });
    const j = await res.json(); setBusy(false);
    if (j.error) { setErr(j.error); return; }
    if (!j.startDate) alert(`Imported "${j.series?.title}" (${j.daysCreated} days) — but no Start date was found, so days won't be date-locked. Add a "Start: YYYY-MM-DD" line near the top of the file, or set the date by editing the series.`);
    onImported();
  }
  return (
    <div>
      <button className="btn-ghost" style={{ marginBottom: 14, width: "auto", padding: "8px 14px" }} onClick={onCancel}><i className="ti ti-arrow-left" /> Back</button>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Import a series from Markdown</div>
        <p style={{ fontSize: 12, color: "var(--muted)", lineHeight: 1.5, marginBottom: 12 }}>
          Format: <code># Series Title</code> with optional <code>Subtitle:</code> / <code>Week:</code> / <code>Start:</code> lines, then a <code>## Day 1 — Title</code> per day, each with <code>Passage:</code>, <code>Also:</code>, and <code>### Lesson</code> / <code>### Reflect</code> (bulleted) / <code>### Prayer</code> sections. Leave a passage's text out to auto-pull the ESV.
        </p>
        <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--accent)", marginBottom: 10, cursor: "pointer" }}>
          <i className="ti ti-upload" /> Upload .md file
          <input type="file" accept=".md,.markdown,text/markdown,text/plain" onChange={onFile} style={{ display: "none" }} />
        </label>
        <textarea style={{ ...inputStyle, minHeight: 240, resize: "vertical", fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.5 }} value={md} onChange={(e) => setMd(e.target.value)} placeholder={"# Series title\nSubtitle: (optional)\nWeek: 1\nStart: 2026-06-08\n\n## Day 1 — Day title\nPassage: John 3:16-21\n\n### Lesson\nYour lesson text…\n\n### Reflect\n- A reflection question?\n\n### Prayer\nA closing prayer prompt."} />
        {err && <div style={{ fontSize: 13, color: "#b4452f", marginTop: 8 }}>{err}</div>}
        <button className="btn-primary" style={{ marginTop: 12 }} onClick={run} disabled={!md.trim() || busy}>{busy ? "Importing…" : "Import series"}</button>
      </Card>
    </div>
  );
}

function SeriesEditor({ editing, onChange, onSave, onCancel }: { editing: any; onChange: (e: any) => void; onSave: (s: any) => void; onCancel: () => void }) {
  return (
    <div>
      <button className="btn-ghost" style={{ marginBottom: 14, width: "auto", padding: "8px 14px" }} onClick={onCancel}><i className="ti ti-arrow-left" /> Back</button>
      <Card>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>{editing.id ? "Edit series" : "New series"}</div>
        <Field label="Series title"><input style={inputStyle} value={editing.title} onChange={(e) => onChange({ ...editing, title: e.target.value })} placeholder="Series title" /></Field>
        <Field label="Subtitle"><input style={inputStyle} value={editing.subtitle ?? ""} onChange={(e) => onChange({ ...editing, subtitle: e.target.value })} /></Field>
        <Field label="Week number"><input style={inputStyle} type="number" value={editing.weekNumber ?? ""} onChange={(e) => onChange({ ...editing, weekNumber: Number(e.target.value) })} /></Field>
        <Field label="Start date (Day 1 opens this day)" hint="Day N opens that many days later, only on that day. Blank = all days open immediately.">
          <input style={inputStyle} type="date" value={toDateInput(editing.startDate)} onChange={(e) => onChange({ ...editing, startDate: e.target.value })} />
        </Field>
        <Field label="Welcome intro override (optional)" hint="Overrides the church-wide intro for this series. Blank = use the global one.">
          <textarea style={{ ...inputStyle, minHeight: 64, resize: "vertical" }} value={editing.introText ?? ""} onChange={(e) => onChange({ ...editing, introText: e.target.value })} placeholder="Leave blank to use the global intro" />
        </Field>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => onSave(editing)}>Save series</button>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </Card>
    </div>
  );
}

function DayEditor({ day, onSave, onCancel, onDelete }: { day: any; onSave: (d: any) => void; onCancel: () => void; onDelete?: () => void }) {
  const [d, setD] = useState({ ...day, reflectionQuestions: Array.isArray(day.reflectionQuestions) && day.reflectionQuestions.length ? day.reflectionQuestions : [""] });
  const set = (k: string, v: any) => setD({ ...d, [k]: v });
  const setQ = (i: number, v: string) => { const q = [...d.reflectionQuestions]; q[i] = v; set("reflectionQuestions", q); };
  return (
    <div>
      <button className="btn-ghost" style={{ marginBottom: 14, width: "auto", padding: "8px 14px" }} onClick={onCancel}><i className="ti ti-arrow-left" /> Back</button>
      <Card>
        <Field label="Day number"><input style={inputStyle} type="number" value={d.order} onChange={(e) => set("order", Number(e.target.value))} /></Field>
        <Field label="Day title"><input style={inputStyle} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Day title" /></Field>
        <Field label="Passage reference"><input style={inputStyle} value={d.passageRef} onChange={(e) => set("passageRef", e.target.value)} placeholder="e.g. John 3:16-21" /></Field>
        <Field label="Passage text" hint="Leave blank to pull the ESV text automatically from this reference. Type here only to override.">
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={d.passageText ?? ""} onChange={(e) => set("passageText", e.target.value)} placeholder="(blank = auto ESV)" />
        </Field>
        <Field label="Supporting references (optional)"><input style={inputStyle} value={d.passageRefsExtra ?? ""} onChange={(e) => set("passageRefsExtra", e.target.value)} placeholder="e.g. Romans 8:28" /></Field>
        <Field label="Lesson" hint="The full lesson text shown after the passage."><textarea style={{ ...inputStyle, minHeight: 160, resize: "vertical" }} value={d.teaching} onChange={(e) => set("teaching", e.target.value)} /></Field>
        <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>Reflection questions</span>
        {d.reflectionQuestions.map((q: string, i: number) => (
          <div key={i} style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <textarea style={{ ...inputStyle, minHeight: 44, resize: "vertical" }} value={q} onChange={(e) => setQ(i, e.target.value)} placeholder={`Question ${i + 1}`} />
            <button onClick={() => set("reflectionQuestions", d.reflectionQuestions.filter((_: any, j: number) => j !== i))} style={iconBtn}><i className="ti ti-trash" /></button>
          </div>
        ))}
        <button className="btn-ghost" style={{ fontSize: 13, padding: 8, marginBottom: 12 }} onClick={() => set("reflectionQuestions", [...d.reflectionQuestions, ""])}><i className="ti ti-plus" /> Add question</button>
        <Field label="Prayer prompt (optional)"><input style={inputStyle} value={d.prayerPrompt ?? ""} onChange={(e) => set("prayerPrompt", e.target.value)} placeholder="Write a prayer in response to today." /></Field>
        <Field label="Points (stars) for completing"><input style={inputStyle} type="number" value={d.pointsReward} onChange={(e) => set("pointsReward", Number(e.target.value))} /></Field>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={() => onSave({ ...d, reflectionQuestions: d.reflectionQuestions.filter((q: string) => q.trim()) })}>Save day</button>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
        {onDelete && <button onClick={onDelete} style={{ background: "none", border: "none", color: "#b4452f", fontSize: 13, marginTop: 14, padding: "4px 0" }}><i className="ti ti-trash" /> Delete this day</button>}
      </Card>
    </div>
  );
}

function Members() {
  const [members, setMembers] = useState<any[] | null>(null);
  function load() { fetch("/api/admin?view=members").then((r) => r.json()).then((j) => setMembers(j.members ?? [])); }
  useEffect(load, []);
  async function setRole(userId: string, role: string) {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setRole", userId, role }) });
    load();
  }
  async function remove(userId: string, name: string) {
    if (!confirm(`Remove ${name}? This permanently deletes their account along with their reflections, prayers, and progress. This can't be undone.`)) return;
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "removeMember", userId }) });
    load();
  }
  async function changeEmail(userId: string, name: string, current: string) {
    const next = prompt(`New email for ${name}? They'll sign in with this address from now on; links sent to the old one stop working.`, current);
    if (!next || next.trim().toLowerCase() === current.toLowerCase()) return;
    const r = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "setEmail", userId, email: next.trim() }) });
    const j = await r.json();
    if (j.error) alert(j.error);
    load();
  }
  if (!members) return <div style={{ color: "var(--muted)" }}>Loading…</div>;
  return (
    <div>
      <div className="label" style={{ marginBottom: 10 }}>{members.length} member{members.length === 1 ? "" : "s"}</div>
      {members.map((m) => (
        <div key={m.id} style={{ background: "var(--glassBg)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name={m.name} image={m.image} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{m.name}{m.isMe && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
            <div style={{ fontSize: 11, color: "var(--muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {m.email}
              <button onClick={() => changeEmail(m.id, m.name, m.email)} aria-label={`Change email for ${m.name}`} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 11, padding: "0 0 0 6px", verticalAlign: "baseline" }}><i className="ti ti-pencil" /></button>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Active {fmtAgo(m.lastActiveAt)} · {m.daysCompleted} days</div>
          </div>
          {m.role === "OWNER" ? (
            <span style={{ fontSize: 12, color: "var(--accent)", fontWeight: 600, flex: "none" }}>Owner</span>
          ) : (
            <>
              <select value={m.role} onChange={(e) => setRole(m.id, e.target.value)} disabled={m.isMe} style={{ ...inputStyle, width: "auto", padding: "6px 8px", fontSize: 13, flex: "none", opacity: m.isMe ? 0.5 : 1 }}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
              <button onClick={() => remove(m.id, m.name)} disabled={m.isMe} style={{ ...iconBtn, flex: "none", color: m.isMe ? "var(--muted)" : "#b4452f", opacity: m.isMe ? 0.4 : 1 }} aria-label="Remove member"><i className="ti ti-trash" /></button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function Activity() {
  const [data, setData] = useState<any | null>(null);
  useEffect(() => { fetch("/api/admin?view=activity").then((r) => r.json()).then(setData); }, []);
  if (!data) return <div style={{ color: "var(--muted)" }}>Loading…</div>;
  const trend = Object.entries(data.trend ?? {}) as [string, number][];
  const max = Math.max(1, ...trend.map(([, v]) => v));
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <Metric label="Members" value={data.members} icon="ti-users" />
        <Metric label="Days completed" value={data.completions} icon="ti-check" />
        <Metric label="Shared reflections" value={data.sharedReflections} icon="ti-message-circle" />
        <Metric label="Prayer requests" value={data.sharedPrayers} icon="ti-flame" />
      </div>
      <Card>
        <div className="label" style={{ marginBottom: 12 }}>Completions, last 7 days</div>
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 90 }}>
          {trend.map(([d, v]) => (
            <div key={d} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ height: 70, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                <div style={{ width: "60%", height: `${(v / max) * 70}px`, background: "var(--accent)", borderRadius: 5, opacity: 0.4 + (v / max) * 0.6 }} />
              </div>
              <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 3 }}>{d.slice(5)}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <div className="label" style={{ marginBottom: 4 }}>Most recently active</div>
        {(data.activeUsers ?? []).map((u: any) => (
          <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--line)" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{u.name}{u.isMe && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · you</span>}</div>
              <div style={{ fontSize: 11, color: "var(--muted)" }}>{u.daysCompleted} days completed</div>
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", textAlign: "right", flex: "none" }}>
              <div>visited {fmtAgo(u.lastSeenAt)}</div>
              <div>finished {fmtAgo(u.lastCompletedAt)}</div>
            </div>
          </div>
        ))}
        {(!data.activeUsers || data.activeUsers.length === 0) && <div style={{ fontSize: 13, color: "var(--muted)", paddingTop: 6 }}>No members yet.</div>}
      </Card>
    </div>
  );
}
function Metric({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div style={{ background: "var(--glassBg)", border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
      <div style={{ color: "var(--accent)", fontSize: 14, marginBottom: 4 }}><i className={`ti ${icon}`} /></div>
      <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
    </div>
  );
}

function Moderation() {
  const [data, setData] = useState<any | null>(null);
  function load() { fetch("/api/admin?view=moderation").then((r) => r.json()).then(setData); }
  useEffect(load, []);
  async function moderate(kind: string, id: string, hidden: boolean) {
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "moderate", kind, id, hidden }) });
    load();
  }
  if (!data) return <div style={{ color: "var(--muted)" }}>Loading…</div>;
  return (
    <div>
      <div className="label" style={{ marginBottom: 10 }}>Shared reflections</div>
      {data.reflections.map((r: any) => (<ModRow key={r.id} body={r.body} author={r.anonymous ? "Anonymous" : r.user?.name} hidden={r.hidden} onToggle={() => moderate("reflection", r.id, !r.hidden)} />))}
      <div className="label" style={{ margin: "18px 0 10px" }}>Prayer room</div>
      {data.prayers.map((p: any) => (<ModRow key={p.id} body={p.body} author={p.anonymous ? "Anonymous" : p.user?.name} hidden={p.hidden} onToggle={() => moderate("prayer", p.id, !p.hidden)} />))}
    </div>
  );
}
function ModRow({ body, author, hidden, onToggle }: { body: string; author?: string; hidden: boolean; onToggle: () => void }) {
  return (
    <div style={{ background: "var(--glassBg)", border: "1px solid var(--line)", borderRadius: 12, padding: 12, marginBottom: 8, opacity: hidden ? 0.55 : 1 }}>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>{author ?? "Someone"}</div>
      <div style={{ fontSize: 14, lineHeight: 1.5, color: "var(--body)", marginBottom: 8 }}>{body}</div>
      <button onClick={onToggle} style={{ fontSize: 12, padding: "6px 11px", borderRadius: 99, border: "1px solid var(--line)", background: "transparent", color: hidden ? "var(--accent)" : "var(--body)" }}><i className={`ti ${hidden ? "ti-eye" : "ti-eye-off"}`} /> {hidden ? "Unhide" : "Hide"}</button>
    </div>
  );
}

const iconBtn: React.CSSProperties = { width: 32, height: 32, border: "1px solid var(--line)", borderRadius: 8, background: "transparent", color: "var(--body)" };
