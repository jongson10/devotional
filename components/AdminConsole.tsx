"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "content" | "activity" | "moderation" | "settings";

const TIMEZONES = [
  "America/Los_Angeles", "America/Denver", "America/Chicago", "America/New_York",
  "America/Phoenix", "America/Anchorage", "Pacific/Honolulu", "UTC",
  "Europe/London", "Europe/Paris", "Asia/Seoul", "Asia/Tokyo", "Australia/Sydney",
];

export default function AdminConsole() {
  const [tab, setTab] = useState<Tab>("content");
  return (
    <div style={{ padding: "20px 18px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600 }}>Admin</h1>
        <Link href="/" style={{ fontSize: 13, color: "var(--accent)" }}>Back to app <i className="ti ti-arrow-right" /></Link>
      </div>
      <div style={{ display: "flex", gap: 6, background: "var(--glassBg)", borderRadius: 12, padding: 4, marginBottom: 20 }}>
        {(["content", "activity", "moderation", "settings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", background: tab === t ? "#fff" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontSize: 12, fontWeight: 500, padding: 9, borderRadius: 9, textTransform: "capitalize" }}>{t}</button>
        ))}
      </div>
      {tab === "content" && <ContentManager />}
      {tab === "activity" && <Activity />}
      {tab === "moderation" && <Moderation />}
      {tab === "settings" && <Settings />}
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
const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.6)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 14, width: "100%" };

function toDateInput(v: any): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function Settings() {
  const [tz, setTz] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [saved, setSaved] = useState(false);
  useEffect(() => { fetch("/api/admin?view=series").then((r) => r.json()).then((j) => { setTz(j.church?.timezone ?? "America/Los_Angeles"); setName(j.church?.name ?? ""); }); }, []);
  async function save() {
    setSaved(false);
    await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "saveSettings", timezone: tz, name }) });
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }
  return (
    <Card>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Church settings</div>
      <Field label="Church name"><input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Grace Chapel" /></Field>
      <Field label="Time zone" hint="Used to decide which day's devotional is 'today'. Days unlock at midnight in this zone.">
        <select style={inputStyle} value={tz} onChange={(e) => setTz(e.target.value)}>
          {!TIMEZONES.includes(tz) && tz && <option value={tz}>{tz}</option>}
          {TIMEZONES.map((z) => <option key={z} value={z}>{z}</option>)}
        </select>
      </Field>
      <button className="btn-primary" onClick={save}>Save settings</button>
      {saved && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, textAlign: "center" }}>Saved.</div>}
    </Card>
  );
}

function ContentManager() {
  const [series, setSeries] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [editingDay, setEditingDay] = useState<any | null>(null);
  function load() { fetch("/api/admin?view=series").then((r) => r.json()).then((j) => setSeries(j.series ?? [])); }
  useEffect(load, []);
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
  if (editingDay) return <DayEditor day={editingDay} onSave={saveDay} onCancel={() => setEditingDay(null)} />;
  return (
    <div>
      <button className="btn-ghost" style={{ marginBottom: 16 }} onClick={() => setEditing({ title: "", subtitle: "", weekNumber: series.length + 1, startDate: "" })}><i className="ti ti-plus" /> New series</button>
      {editing && (
        <Card>
          <Field label="Series title"><input style={inputStyle} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Broken Tools and Utter Victory" /></Field>
          <Field label="Subtitle"><input style={inputStyle} value={editing.subtitle ?? ""} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></Field>
          <Field label="Week number"><input style={inputStyle} type="number" value={editing.weekNumber ?? ""} onChange={(e) => setEditing({ ...editing, weekNumber: Number(e.target.value) })} /></Field>
          <Field label="Start date (Day 1 opens this day)" hint="Day N opens that many days later, only on that day. Blank = all days open immediately.">
            <input style={inputStyle} type="date" value={toDateInput(editing.startDate)} onChange={(e) => setEditing({ ...editing, startDate: e.target.value })} />
          </Field>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-primary" style={{ flex: 1 }} onClick={() => saveSeries(editing)}>Save series</button>
            <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </Card>
      )}
      {series.map((s) => (
        <Card key={s.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{s.title}</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.days.length} days · {s.published ? "Published" : "Draft"}{s.startDate ? ` · starts ${toDateInput(s.startDate)}` : " · no date lock"}</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setEditing({ id: s.id, title: s.title, subtitle: s.subtitle, weekNumber: s.weekNumber, startDate: toDateInput(s.startDate) })} style={iconBtn}><i className="ti ti-edit" /></button>
              <button onClick={() => publish(s.id, !s.published)} style={{ ...iconBtn, color: s.published ? "var(--accent)" : "var(--muted)" }}><i className={`ti ${s.published ? "ti-eye" : "ti-eye-off"}`} /></button>
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

function DayEditor({ day, onSave, onCancel }: { day: any; onSave: (d: any) => void; onCancel: () => void }) {
  const [d, setD] = useState({ ...day, reflectionQuestions: Array.isArray(day.reflectionQuestions) && day.reflectionQuestions.length ? day.reflectionQuestions : [""] });
  const set = (k: string, v: any) => setD({ ...d, [k]: v });
  const setQ = (i: number, v: string) => { const q = [...d.reflectionQuestions]; q[i] = v; set("reflectionQuestions", q); };
  return (
    <div>
      <button className="btn-ghost" style={{ marginBottom: 14, width: "auto", padding: "8px 14px" }} onClick={onCancel}><i className="ti ti-arrow-left" /> Back</button>
      <Card>
        <Field label="Day number"><input style={inputStyle} type="number" value={d.order} onChange={(e) => set("order", Number(e.target.value))} /></Field>
        <Field label="Day title"><input style={inputStyle} value={d.title} onChange={(e) => set("title", e.target.value)} placeholder="Hiding in the winepress" /></Field>
        <Field label="Passage reference"><input style={inputStyle} value={d.passageRef} onChange={(e) => set("passageRef", e.target.value)} placeholder="Judges 6:11-16" /></Field>
        <Field label="Passage text" hint="Leave blank to pull the ESV text automatically from this reference. Type here only to override.">
          <textarea style={{ ...inputStyle, minHeight: 90, resize: "vertical" }} value={d.passageText ?? ""} onChange={(e) => set("passageText", e.target.value)} placeholder="(blank = auto ESV)" />
        </Field>
        <Field label="Supporting references (optional)"><input style={inputStyle} value={d.passageRefsExtra ?? ""} onChange={(e) => set("passageRefsExtra", e.target.value)} placeholder="Matthew 6:25-34" /></Field>
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
      </Card>
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
