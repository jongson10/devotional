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

// Folded praying hands — Tabler has no folded-hands glyph, so this is a custom line icon.
export function PrayerHands({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "-2px" }} aria-hidden="true">
      <path d="M12 4C9.6 7.2 7.3 10.6 6.2 14c-.7 2.3.5 4.2 2.9 4.6l2.9.5" />
      <path d="M12 4c2.4 3.2 4.7 6.6 5.8 10 .7 2.3-.5 4.2-2.9 4.6l-2.9.5" />
      <path d="M12 4v15" />
    </svg>
  );
}
