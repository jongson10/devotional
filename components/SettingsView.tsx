"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "./ThemeProvider";
import { Avatar } from "./Avatar";

const inputStyle: React.CSSProperties = { background: "rgba(255,255,255,0.6)", border: "1px solid var(--line)", borderRadius: 10, padding: "9px 12px", fontSize: 14, width: "100%" };
const THEMES: { key: "dawn" | "night" | "auto"; label: string; icon: string }[] = [
  { key: "dawn", label: "Light", icon: "ti-sun" },
  { key: "night", label: "Dark", icon: "ti-moon" },
  { key: "auto", label: "Auto", icon: "ti-device-desktop" },
];

export default function SettingsView({ name, email, bio, image, isAdmin }: { name: string; email: string; bio: string; image: string; isAdmin: boolean }) {
  const router = useRouter();
  const { mode, setMode } = useTheme();
  const [n, setN] = useState(name);
  const [b, setB] = useState(bio);
  const [img, setImg] = useState(image);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: n, bio: b, image: img }) });
    setBusy(false); setSaved(true); setTimeout(() => setSaved(false), 2200); router.refresh();
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const im = new window.Image();
      im.onload = () => {
        const S = 256;
        const c = document.createElement("canvas"); c.width = S; c.height = S;
        const ctx = c.getContext("2d"); if (!ctx) return;
        const scale = Math.max(S / im.width, S / im.height);
        const w = im.width * scale, h = im.height * scale;
        ctx.drawImage(im, (S - w) / 2, (S - h) / 2, w, h);
        setImg(c.toDataURL("image/jpeg", 0.78));
      };
      im.src = String(reader.result);
    };
    reader.readAsDataURL(f);
  }

  return (
    <div style={{ padding: "26px 18px", maxWidth: 480, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em" }}>Settings</h1>
        {isAdmin && <Link href="/admin" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 13, fontWeight: 500, color: "var(--accent)" }}><i className="ti ti-settings-cog" /> Admin</Link>}
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 12 }}>Profile</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <Avatar name={n || "?"} image={img} size={56} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "var(--accent)", cursor: "pointer" }}>
              <i className="ti ti-camera" /> Upload photo
              <input type="file" accept="image/*" onChange={onPhoto} style={{ display: "none" }} />
            </label>
            {img && <button onClick={() => setImg("")} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: 12, padding: 0, textAlign: "left" }}>Remove photo</button>}
          </div>
        </div>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>…or paste an image URL</span>
          <input style={inputStyle} value={img.startsWith("data:") ? "" : img} onChange={(e) => setImg(e.target.value)} placeholder="https://… (link to an image)" />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>Name</span>
          <input style={inputStyle} value={n} onChange={(e) => setN(e.target.value)} placeholder="Your name" />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>Email</span>
          <input style={{ ...inputStyle, opacity: 0.6 }} value={email} disabled />
        </label>
        <label style={{ display: "block", marginBottom: 14 }}>
          <span style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 5 }}>Bio</span>
          <textarea style={{ ...inputStyle, minHeight: 70, resize: "vertical" }} value={b} onChange={(e) => setB(e.target.value)} placeholder="A short line about you (optional)" maxLength={300} />
        </label>
        <button className="btn-primary" onClick={save} disabled={busy}>Save profile</button>
        {saved && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 8, textAlign: "center" }}>Saved.</div>}
      </div>

      <div className="glass" style={{ borderRadius: 14, padding: 16, marginBottom: 14 }}>
        <div className="label" style={{ marginBottom: 12 }}>Appearance</div>
        <div style={{ display: "flex", gap: 8 }}>
          {THEMES.map((t) => (
            <button key={t.key} onClick={() => setMode(t.key)} style={{ flex: 1, border: `1px solid ${mode === t.key ? "var(--accent)" : "var(--line)"}`, background: mode === t.key ? "var(--glassBg)" : "transparent", color: mode === t.key ? "var(--accent)" : "var(--body)", borderRadius: 11, padding: "12px 8px", fontSize: 13, fontWeight: 500, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <i className={`ti ${t.icon}`} style={{ fontSize: 18 }} /> {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
