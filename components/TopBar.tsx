"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export default function TopBar({ isAdmin: _isAdmin = false, nav }: { isAdmin?: boolean; nav?: { reflections: boolean; prayer: boolean; community: boolean } }) {
  const path = usePathname();
  if (path?.startsWith("/admin") || path?.startsWith("/login")) return null;
  const n = nav ?? { reflections: true, prayer: true, community: true };
  const is = (href: string) => href === "/" ? path === "/" : path?.startsWith(href);
  return (
    <nav className="tab-bar" aria-label="Main">
      <Link href="/" className={is("/") ? "active" : ""}><i className="ti ti-home" aria-hidden="true" /> Home</Link>
      {n.reflections && <Link href="/reflections" className={is("/reflections") ? "active" : ""}><i className="ti ti-message-circle" aria-hidden="true" /> Reflect</Link>}
      {n.prayer && <Link href="/prayer" className={is("/prayer") ? "active" : ""}><i className="ti ti-heart-handshake" aria-hidden="true" /> Prayer</Link>}
      {n.community && <Link href="/community" className={is("/community") ? "active" : ""}><i className="ti ti-users" aria-hidden="true" /> People</Link>}
      <Link href="/settings" className={is("/settings") ? "active" : ""}><i className="ti ti-settings" aria-hidden="true" /> Settings</Link>
    </nav>
  );
}
