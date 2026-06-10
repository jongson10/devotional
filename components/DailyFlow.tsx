"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type DayData = {
  id: string; order: number; title: string;
  passageRef: string; passageText: string; passageRefsExtra: string | null;
  pastorNote: string | null; teaching: string;
  reflectionQuestions: string[]; prayerPrompt: string | null;
  pointsReward: number; seriesTitle: string; weekNumber: number | null;
  esv?: boolean; esvCopyright?: string | null;
};
type Stage = "loading" | "intro" | "passage" | "lesson" | "reflect" | "prayer" | "complete";

async function recordStep(dayId: string, step: number) {
  try { await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayId, step }) }); } catch {}
}

function PassageText({ text }: { text: string }) {
  const parts = text.split(/(\[\d+\])/g);
  return (
    <div style={{ fontSize: 16, lineHeight: 1.7, whiteSpace: "pre-line" }}>
      {parts.map((p, i) => {
        const m = p.match(/^\[(\d+)\]$/);
        if (m) return <sup key={i} style={{ fontSize: "0.62em", color: "var(--accent)", fontWeight: 600, marginRight: 2, verticalAlign: "super" }}>{m[1]}</sup>;
        return <span key={i}>{p}</span>;
      })}
    </div>
  );
}

type Initial =
  | { error: string; status?: number }
  | { day: any; progress: { step: number; completed: boolean }; myReflections: { questionIndex: number; body: string }[]; myPrayer: { body: string; shared: boolean } | null };

type DerivedState = {
  err: string | null; data?: DayData; reflectAnswers?: Record<number, string[]>;
  prayerText?: string | null; prayerShare?: boolean; revealed?: { passage: boolean; lesson: boolean };
  stage?: Stage; activeQ?: number; alreadyDone?: boolean;
};

// Compute the full initial view state from the server-provided payload (no fetch).
function deriveInitialState(initial: Initial): DerivedState {
  const j: any = initial;
  if (!j) return { err: "Could not load." };
  if (j.error === "locked") return { err: "This day isn't open. Each day's devotional can only be done on its own day." };
  if (j.error) return { err: j.error === "bad request" ? "No day selected." : j.error };
  const d = j.day as DayData;
  d.reflectionQuestions = Array.isArray(d.reflectionQuestions) ? d.reflectionQuestions : [];

  const savedStep: number = j.progress?.step ?? 0;
  const completed: boolean = j.progress?.completed ?? false;
  const savedReflections: { questionIndex: number; body: string }[] = j.myReflections ?? [];
  const savedPrayer: { body: string; shared: boolean } | null = j.myPrayer ?? null;

  const reflectAnswers: Record<number, string[]> = {};
  for (const r of savedReflections) reflectAnswers[r.questionIndex] = [r.body];
  const revealed = savedStep >= 1 ? { passage: true, lesson: true } : { passage: false, lesson: false };

  let stage: Stage; let alreadyDone = false;
  if (completed || savedStep >= 4) { alreadyDone = true; stage = "complete"; }
  else if (savedStep === 3) stage = "complete";
  else if (savedStep === 2) stage = "prayer";
  else if (savedStep === 1) stage = "lesson";
  else stage = "intro";

  const answered = new Set(savedReflections.map((r) => r.questionIndex));
  let firstUnanswered = 0;
  while (answered.has(firstUnanswered) && firstUnanswered < d.reflectionQuestions.length) firstUnanswered++;
  const activeQ = Math.min(firstUnanswered, Math.max(0, d.reflectionQuestions.length - 1));
  if (savedStep === 1 && answered.size > 0 && answered.size < d.reflectionQuestions.length) stage = "reflect";

  return { err: null, data: d, reflectAnswers, prayerText: savedPrayer?.body ?? null, prayerShare: !!savedPrayer?.shared, revealed, stage, activeQ, alreadyDone };
}

export default function DailyFlow({ initial }: { initial: Initial }) {
  const router = useRouter();
  const init = useMemo(() => deriveInitialState(initial), [initial]);
  const [data, setData] = useState<DayData | null>(init.data ?? null);
  const [err, setErr] = useState<string | null>(init.err);
  const [stage, setStage] = useState<Stage>(init.stage ?? "loading");
  const [reflectAnswers, setReflectAnswers] = useState<Record<number, string[]>>(init.reflectAnswers ?? {});
  const [activeQ, setActiveQ] = useState(init.activeQ ?? 0);
  const [draft, setDraft] = useState("");
  const [prayerShare, setPrayerShare] = useState(init.prayerShare ?? false);
  const [prayerText, setPrayerText] = useState<string | null>(init.prayerText ?? null);
  const [streak, setStreak] = useState(1);
  const [showComplete, setShowComplete] = useState(false);
  const [showFeed, setShowFeed] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(init.alreadyDone ?? false);
  const [editingRef, setEditingRef] = useState<{ q: number; j: number } | null>(null);
  const [editingPrayer, setEditingPrayer] = useState(false);
  const [editDraft, setEditDraft] = useState("");

  // which sections are revealed (passage and lesson reveal one at a time)
  const [revealed, setRevealed] = useState<{ passage: boolean; lesson: boolean }>(init.revealed ?? { passage: false, lesson: false });

  if (err) return <div style={{ padding: 28, color: "var(--muted)", textAlign: "center", lineHeight: 1.6 }}>{err}</div>;
  if (!data || stage === "loading") return (
    <div style={{ padding: "18px 18px" }} aria-busy="true" aria-label="Loading">
      <div className="skel" style={{ width: 90, height: 11, marginBottom: 12 }} />
      <div className="skel" style={{ width: "72%", height: 22, marginBottom: 28, display: "block" }} />
      <div className="skel" style={{ width: 70, height: 11, marginBottom: 14 }} />
      {["100%", "96%", "90%", "94%", "86%"].map((w, i) => (<div key={i} className="skel" style={{ width: w, height: 13, marginBottom: 9, display: "block" }} />))}
    </div>
  );

  const points = data.pointsReward;
  const accent = "var(--accent)";
  const allReflectionsAnswered = data.reflectionQuestions.length > 0 && data.reflectionQuestions.every((_, i) => (reflectAnswers[i]?.length ?? 0) > 0);

  async function saveReflection(qIndex: number, body: string) {
    await fetch("/api/reflections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayId: data!.id, questionIndex: qIndex, body }) });
  }
  async function savePrayer(body: string, shared: boolean) {
    await fetch("/api/prayers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayId: data!.id, body, shared, anonymous: false }) });
  }
  function revealPassage() { setRevealed((p) => ({ ...p, passage: true })); setStage("passage"); }
  function revealLesson() { setRevealed((p) => ({ ...p, lesson: true })); setStage("lesson"); recordStep(data!.id, 1); }
  async function completeDay() {
    const r = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dayId: data!.id, step: 4 }) });
    const j = await r.json(); setStreak(j.streak ?? 1); setShowComplete(true);
  }
  function sendReflectAnswer() {
    const v = draft.trim(); if (!v) return;
    const arr = reflectAnswers[activeQ] ?? [];
    setReflectAnswers({ ...reflectAnswers, [activeQ]: [...arr, v] });
    saveReflection(activeQ, v); setDraft("");
    if (activeQ + 1 < data!.reflectionQuestions.length) setActiveQ(activeQ + 1);
    else { recordStep(data!.id, 2); setStage("prayer"); setActiveQ(0); }
  }
  function sendPrayer() {
    const v = draft.trim(); if (!v) return;
    setPrayerText(v); savePrayer(v, prayerShare); setDraft(""); recordStep(data!.id, 3); setStage("complete");
  }
  function commitEditReflection(q: number, j: number) {
    const v = editDraft.trim(); if (!v) { setEditingRef(null); return; }
    setReflectAnswers((prev) => { const arr = [...(prev[q] ?? [])]; arr[j] = v; return { ...prev, [q]: arr }; });
    saveReflection(q, v); setEditingRef(null); setEditDraft("");
  }
  function commitEditPrayer() {
    const v = editDraft.trim(); if (!v) { setEditingPrayer(false); return; }
    setPrayerText(v); savePrayer(v, prayerShare); setEditingPrayer(false); setEditDraft("");
  }
  // Rewind the unfold sequence one step. View-only: saved reflections/prayer are kept.
  function stepBackView() {
    setShowComplete(false);
    if (stage === "complete") setStage("prayer");
    else if (stage === "prayer") setStage("reflect");
    else if (stage === "reflect") setStage("lesson");
    else if (stage === "lesson") { setRevealed({ passage: true, lesson: false }); setStage("passage"); }
    else if (stage === "passage") { setRevealed({ passage: false, lesson: false }); setStage("intro"); }
  }

  return (
    <div style={{ position: "relative", minHeight: "calc(100vh - 50px)" }}>
      <div style={{ padding: "18px 18px 120px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div className="label">Day {data.order}{data.weekNumber ? ` · Week ${data.weekNumber}` : ""}</div>
            <div style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", lineHeight: 1.15, marginTop: 5 }}>{data.title}</div>
          </div>
          <ProgressDots stage={stage} onStepBack={stepBackView} />
        </div>

        {alreadyDone && (
          <div className="glass" style={{ borderRadius: 12, padding: "10px 13px", marginBottom: 18, fontSize: 13, color: "var(--soft)", display: "flex", alignItems: "center", gap: 7 }}>
            <i className="ti ti-circle-check" style={{ color: accent }} /> You completed this day. You can revisit it below.
          </div>
        )}

        {!revealed.passage && (
          <section className="rise" style={{ marginBottom: 22 }}>
            <div className="label" style={{ marginBottom: 11 }}>Today</div>
            <div style={{ fontSize: 14, lineHeight: 1.6, color: "var(--body)" }}>Begin by reading today's passage. Then we'll walk through the lesson, reflection, and a closing prayer.</div>
          </section>
        )}

        {revealed.passage && (
          <section className="rise" style={{ marginBottom: 22 }}>
            <div className="label" style={{ marginBottom: 11 }}>Passage · {data.passageRef}</div>
            <PassageText text={data.passageText} />
            {data.passageRefsExtra && (<div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>Also: {data.passageRefsExtra}</div>)}
            {data.esv && data.esvCopyright && (
              <div style={{ marginTop: 12, fontSize: 11, lineHeight: 1.5, color: "var(--muted)" }}>{data.esvCopyright}{" "}<a href="https://www.esv.org" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>esv.org</a></div>
            )}
          </section>
        )}

        {revealed.lesson && (
          <section className="rise" style={{ marginBottom: 22 }}>
            <div className="label" style={{ marginBottom: 11 }}>Lesson</div>
            <div style={{ fontSize: 14, lineHeight: 1.65, color: "var(--body)", whiteSpace: "pre-line" }}>{data.teaching}</div>
          </section>
        )}

        {(stage === "reflect" || stage === "prayer" || stage === "complete") && (
          <section className="rise" style={{ marginBottom: 22 }}>
            <div className="label" style={{ marginBottom: 11 }}>Reflect</div>
            {data.reflectionQuestions.map((q, i) => (
              <div key={i} style={{ marginBottom: 20, opacity: i <= (stage === "reflect" ? activeQ : 99) ? 1 : 0.3, transition: "opacity .3s" }}>
                <div style={{ display: "flex", gap: 9 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: accent, lineHeight: 1.5 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45 }}>{q}</div>
                    {(reflectAnswers[i] ?? []).map((a, j) => (
                      editingRef && editingRef.q === i && editingRef.j === j ? (
                        <div key={j} className="glass" style={{ borderRadius: 12, padding: "6px 6px 6px 12px", display: "flex", alignItems: "flex-end", gap: 6, marginTop: 6 }}>
                          <textarea autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEditReflection(i, j); } if (e.key === "Escape") setEditingRef(null); }} style={{ flex: 1, resize: "none", fontSize: 15, lineHeight: 1.5, padding: "6px 0", minHeight: 22 }} />
                          <button onClick={() => commitEditReflection(i, j)} aria-label="Save" style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-check" /></button>
                        </div>
                      ) : (
                        <div key={j} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 4 }}>
                          <div style={{ flex: 1, fontSize: 15, lineHeight: 1.6, color: "var(--soft)", fontStyle: "italic" }}>{a}</div>
                          <button onClick={() => { setEditingRef({ q: i, j }); setEditDraft(a); }} aria-label="Edit" style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, padding: 2, flex: "none" }}><i className="ti ti-pencil" /></button>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}

        {(stage === "prayer" || stage === "complete") && (
          <section className="rise" style={{ marginBottom: 22 }}>
            <div className="label" style={{ marginBottom: 11 }}>Journal &amp; prayer</div>
            <button onClick={() => { const next = !prayerShare; setPrayerShare(next); if (prayerText) savePrayer(prayerText, next); }}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: prayerShare ? accent : "var(--muted)", background: "none", border: "none", padding: "2px 0", marginBottom: 14 }}>
              <i className={`ti ${prayerShare ? "ti-users" : "ti-lock"}`} style={{ fontSize: 14, color: prayerShare ? accent : undefined }} />
              {prayerShare ? "Sharing to the prayer room" : "Private — only you can see this"}
              <span style={{ fontSize: 11, color: accent, marginLeft: 2 }}>· tap to {prayerShare ? "keep private" : "share"}</span>
            </button>
            <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.45, marginBottom: 8 }}>{data.prayerPrompt ?? "Write a prayer in response to today."}</div>
            {prayerText && !editingPrayer && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                <div style={{ flex: 1, fontSize: 15, lineHeight: 1.6, color: "var(--soft)", fontStyle: "italic" }}>{prayerText}{prayerShare && (<div style={{ fontSize: 11, color: accent, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}><i className="ti ti-users" /> Shared to prayer room</div>)}</div>
                <button onClick={() => { setEditingPrayer(true); setEditDraft(prayerText); }} aria-label="Edit prayer" style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 13, padding: 2, flex: "none" }}><i className="ti ti-pencil" /></button>
              </div>
            )}
            {editingPrayer && (
              <div className="glass" style={{ borderRadius: 12, padding: "6px 6px 6px 12px", display: "flex", alignItems: "flex-end", gap: 6 }}>
                <textarea autoFocus value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEditPrayer(); } if (e.key === "Escape") setEditingPrayer(false); }} style={{ flex: 1, resize: "none", fontSize: 15, lineHeight: 1.5, padding: "6px 0", minHeight: 22 }} />
                <button onClick={commitEditPrayer} aria-label="Save prayer" style={{ width: 30, height: 30, flex: "none", border: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}><i className="ti ti-check" /></button>
              </div>
            )}
          </section>
        )}
      </div>

      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 8, maxWidth: 440, margin: "0 auto", padding: "12px 16px calc(16px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "center" }}>
        {!revealed.passage && (<button className="btn-ghost btn-dock" onClick={revealPassage}><i className="ti ti-book-2" /> Read the passage</button>)}
        {revealed.passage && !revealed.lesson && (<button className="btn-ghost btn-dock" onClick={revealLesson}><i className="ti ti-arrow-down" /> Continue to lesson</button>)}
        {revealed.lesson && stage === "lesson" && (<button className="btn-ghost btn-dock" onClick={() => setStage("reflect")}><i className="ti ti-pencil" /> Reflect</button>)}
        {stage === "reflect" && allReflectionsAnswered && (<button className="btn-ghost btn-dock" onClick={() => { setStage("prayer"); setActiveQ(0); }}><i className="ti ti-arrow-down" /> Continue to journal &amp; prayer</button>)}
        {stage === "reflect" && !allReflectionsAnswered && (<InputBar value={draft} setValue={setDraft} onSend={sendReflectAnswer} placeholder={`Reflection #${activeQ + 1}…`} />)}
        {stage === "prayer" && prayerText && (<button className="btn-ghost btn-dock" onClick={() => setStage("complete")}><i className="ti ti-arrow-down" /> Continue</button>)}
        {stage === "prayer" && !prayerText && (<InputBar value={draft} setValue={setDraft} onSend={sendPrayer} placeholder="Write your prayer…" />)}
        {stage === "complete" && !showComplete && !alreadyDone && (<button className="btn-primary" style={{ maxWidth: 320 }} onClick={completeDay}><i className="ti ti-check" /> Complete day</button>)}
        {stage === "complete" && alreadyDone && (<button className="btn-ghost btn-dock" onClick={() => setShowFeed(true)}><i className="ti ti-users" /> See reflections</button>)}
      </div>

      {showComplete && <CompleteOverlay streak={streak} points={points} onSeeFeed={() => setShowFeed(true)} />}
      {showFeed && (<CommunitySheet myPrayer={prayerShare ? prayerText : null} onClose={() => { setShowFeed(false); router.push("/"); }} />)}
    </div>
  );
}

function ProgressDots({ stage, onStepBack }: { stage: Stage; onStepBack?: () => void }) {
  const order: Stage[] = ["passage", "lesson", "reflect", "prayer"];
  const idx = stage === "complete" ? 4 : stage === "intro" ? 0 : Math.max(0, order.indexOf(stage));
  const canStepBack = stage !== "intro";
  return (
    <div style={{ display: "flex", gap: 6, paddingTop: 6 }}>
      {[0, 1, 2, 3].map((n) => (
        <button key={n} onClick={onStepBack} disabled={!canStepBack} aria-label="Step back one" title="Tap to step back one"
          style={{ width: 26, height: 3, borderRadius: 99, background: n <= idx ? "var(--accent)" : "var(--line)", transition: "background .3s", border: "none", padding: 0, cursor: canStepBack ? "pointer" : "default" }} />
      ))}
    </div>
  );
}

function InputBar({ value, setValue, onSend, placeholder }: { value: string; setValue: (s: string) => void; onSend: () => void; placeholder: string; }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => { const el = ref.current; if (!el) return; el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 140) + "px"; }, [value]);
  const hasText = value.trim().length > 0;
  return (
    <div className="glass" style={{ width: "100%", borderRadius: 24, padding: "6px 6px 6px 16px", display: "flex", alignItems: "flex-end", gap: 8 }}>
      <textarea ref={ref} rows={1} value={value} placeholder={placeholder} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); } }} style={{ flex: 1, resize: "none", fontSize: 15, lineHeight: 1.45, padding: "8px 0", minHeight: 22, maxHeight: 140, overflowY: "auto" }} />
      <button onClick={onSend} aria-label="Send" disabled={!hasText} style={{ width: 36, height: 36, flex: "none", border: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", opacity: hasText ? 1 : 0.5, transition: "opacity .2s" }}><i className="ti ti-arrow-up" /></button>
    </div>
  );
}

function CompleteOverlay({ streak, points, onSeeFeed }: { streak: number; points: number; onSeeFeed: () => void }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => { const t1 = setTimeout(() => setPhase(1), 120); const t2 = setTimeout(() => setPhase(2), 1100); const t3 = setTimeout(() => setPhase(3), 1500); return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); }; }, []);
  return (
    <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--glassBg)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", zIndex: 20 }}>
      <div style={{ position: "relative" }}>
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--line)" strokeWidth="6" />
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--accent)" strokeWidth="6" strokeLinecap="round" strokeDasharray="327" strokeDashoffset={phase >= 1 ? 0 : 327} transform="rotate(-90 60 60)" style={{ transition: "stroke-dashoffset 1s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38, color: "var(--accent)", transform: phase >= 2 ? "scale(1)" : "scale(0)", transition: "transform .4s cubic-bezier(.2,1.4,.4,1)" }}><i className="ti ti-check" /></div>
      </div>
      <div style={{ textAlign: "center", marginTop: 18, opacity: phase >= 2 ? 1 : 0, transform: phase >= 2 ? "none" : "translateY(8px)", transition: "all .5s" }}>
        <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.01em" }}>Day complete</div>
        <div style={{ fontSize: 14, color: "var(--body)", marginTop: 5 }}><i className="ti ti-flame" style={{ color: "var(--accent)" }} /> {streak}-day streak · <i className="ti ti-star" style={{ color: "var(--accent)" }} /> +{points}</div>
      </div>
      <div style={{ position: "absolute", bottom: 24, left: 18, right: 18, opacity: phase >= 3 ? 1 : 0, transition: "opacity .5s", display: "flex", justifyContent: "center" }}>
        <button className="btn-primary" style={{ maxWidth: 320 }} onClick={onSeeFeed}>See how others reflected <i className="ti ti-chevron-up" /></button>
      </div>
    </div>
  );
}

function CommunitySheet({ myPrayer, onClose }: { myPrayer: string | null; onClose: () => void }) {
  const [tab, setTab] = useState<"reflections" | "prayers">("reflections");
  const [reflections, setReflections] = useState<any[]>([]);
  const [prayers, setPrayers] = useState<any[]>([]);
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { setTimeout(() => setShown(true), 20); }, []);
  useEffect(() => { Promise.all([
    fetch("/api/reflections?feed=1").then((r) => r.json()).then((j) => setReflections(j.reflections ?? [])),
    fetch("/api/prayers?room=1").then((r) => r.json()).then((j) => setPrayers(j.prayers ?? [])),
  ]).finally(() => setLoading(false)); }, []);
  async function react(type: "AMEN" | "PRAYING", id: string, kind: "reflection" | "prayer") {
    await fetch("/api/reactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, [kind === "reflection" ? "reflectionId" : "prayerId"]: id }) });
  }
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 30 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, maxWidth: 440, margin: "0 auto", height: "90%", background: "var(--gradient)", borderRadius: "24px 24px 0 0", borderTop: "1px solid var(--glassBorder)", transform: shown ? "translateY(0)" : "translateY(100%)", transition: "transform .45s cubic-bezier(.2,.8,.2,1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 8px" }}>
          <div style={{ width: 38, height: 4, borderRadius: 99, background: "var(--line)", margin: "0 auto 12px" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="label" style={{ display: "flex", alignItems: "center", gap: 5 }}><i className="ti ti-users" /> Community</div>
            <button onClick={onClose} style={{ width: 30, height: 30, border: "none", background: "var(--glassBg)", borderRadius: "50%", color: "var(--body)" }}><i className="ti ti-x" /></button>
          </div>
          <div style={{ display: "flex", gap: 6, background: "var(--glassBg)", borderRadius: 12, padding: 4 }}>
            {(["reflections", "prayers"] as const).map((t) => (<button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", background: tab === t ? "var(--glassBorder)" : "transparent", color: tab === t ? "var(--ink)" : "var(--muted)", fontSize: 13, fontWeight: 500, padding: 9, borderRadius: 9 }}>{t === "reflections" ? "Reflections" : "Prayer room"}</button>))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {loading && [0, 1].map((i) => (<div key={i} className="skel" style={{ height: 92, borderRadius: 16, display: "block" }} />))}
          {!loading && tab === "reflections" && reflections.map((p) => (<PostCard key={p.id} author={p.author} body={p.body} mine={p.isMine} reactions={[{ icon: "ti-flame", label: "Amen", count: p.amen, on: p.iReacted?.amen, onClick: () => react("AMEN", p.id, "reflection") }, { icon: "ti-hand-stop", label: "Praying", count: p.praying, on: p.iReacted?.praying, onClick: () => react("PRAYING", p.id, "reflection") }]} />))}
          {!loading && tab === "reflections" && reflections.length === 0 && <Empty text="No shared reflections yet." />}
          {tab === "prayers" && myPrayer && (<PostCard author="You" body={myPrayer} mine note="Shared just now" reactions={[{ icon: "ti-hand-stop", label: "Praying", count: 0, on: false, onClick: () => {} }]} />)}
          {!loading && tab === "prayers" && prayers.filter((p) => !p.isMine || !myPrayer).map((p) => (<PostCard key={p.id} author={p.author} body={p.body} mine={p.isMine} reactions={[{ icon: "ti-hand-stop", label: "Praying", count: p.praying, on: p.iPrayed, onClick: () => react("PRAYING", p.id, "prayer") }]} />))}
          {!loading && tab === "prayers" && prayers.length === 0 && !myPrayer && <Empty text="The prayer room is quiet right now." />}
        </div>
      </div>
    </div>
  );
}

function PostCard({ author, body, mine, note, reactions }: { author: string; body: string; mine?: boolean; note?: string; reactions: { icon: string; label: string; count: number; on?: boolean; onClick: () => void }[]; }) {
  const initials = author === "Anonymous" ? "?" : author.split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <div style={{ background: "var(--glassBg)", border: `1px solid ${mine ? "var(--accent)" : "var(--line)"}`, borderRadius: 16, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 500 }}>{initials}</div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{author}{note && <span style={{ color: "var(--accent)", fontWeight: 400 }}> · {note}</span>}</div>
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--body)", marginBottom: 12 }}>{body}</div>
      <div style={{ display: "flex", gap: 8 }}>{reactions.map((r) => <ReactBtn key={r.label} {...r} />)}</div>
    </div>
  );
}

function ReactBtn({ icon, label, count, on, onClick }: { icon: string; label: string; count: number; on?: boolean; onClick: () => void }) {
  const [active, setActive] = useState(!!on);
  const [c, setC] = useState(count);
  return (
    <button onClick={() => { setActive(!active); setC(c + (active ? -1 : 1)); onClick(); }} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "6px 11px", borderRadius: 99, border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`, background: active ? "var(--glassBg)" : "transparent", color: active ? "var(--accent)" : "var(--body)" }}>
      <i className={`ti ${icon}`} /> {label} <span>{c}</span>
    </button>
  );
}

function Empty({ text }: { text: string }) { return <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "30px 0" }}>{text}</div>; }
