"use client";

const initialsOf = (a: string) => (a === "Anonymous" ? "?" : a.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase());

export function Avatar({ name, image, size = 34 }: { name: string; image?: string | null; size?: number }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" width={size} height={size} style={{ width: size, height: size, flex: "none", borderRadius: "50%", objectFit: "cover", background: "var(--glassBg)" }} />;
  }
  return (
    <div style={{ width: size, height: size, flex: "none", borderRadius: "50%", background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.round(size * 0.38), fontWeight: 500 }}>
      {initialsOf(name)}
    </div>
  );
}

// Folded praying hands — the 🙏 emoji renders cleanest and most recognizably.
export function PrayerHands({ size = 14 }: { size?: number }) {
  return <span aria-hidden="true" style={{ fontSize: size, lineHeight: 1 }}>🙏</span>;
}
