import "../styles/globals.css";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SessionProvider } from "next-auth/react";
import { requireUser } from "@/lib/auth";
import { navConfig } from "@/lib/feed";
import TopBar from "@/components/TopBar";
export const metadata: Metadata = { title: "Daily Devotional", description: "Walk through Sunday's message, one day at a time.", manifest: "/manifest.json" };
export const viewport: Viewport = { themeColor: "#FAFAF8", width: "device-width", initialScale: 1 };
export const dynamic = "force-dynamic";
export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const nav = user ? await navConfig(user) : undefined;
  return (
    <html lang="en" data-theme="dawn">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.26.0/dist/tabler-icons.min.css" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body><SessionProvider><ThemeProvider><div className="app-shell"><TopBar nav={nav} />{children}</div></ThemeProvider></SessionProvider></body>
    </html>
  );
}
