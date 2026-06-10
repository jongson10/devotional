"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function TopBar({ isAdmin: _isAdmin = false }: { isAdmin?: boolean }) {
  const path = usePathname();
  if (path?.startsWith("/admin") || path?.startsWith("/login")) return null;
  const is = (href: string) => href === "/" ? path === "/" : path?.startsWith(href);
  return (
    <nav className="top-bar">
      <div className="top-bar-links">
        <Link href="/" className={is("/") ? "active" : ""}>Home</Link>
        <Link href="/reflections" className={is("/reflections") ? "active" : ""}>Reflections</Link>
        <Link href="/prayer" className={is("/prayer") ? "active" : ""}>Prayer</Link>
        <Link href="/community" className={is("/community") ? "active" : ""}>Community</Link>
      </div>
      <Link href="/settings" aria-label="Settings" className="top-bar-gear"><i className="ti ti-settings" /></Link>
    </nav>
  );
}
