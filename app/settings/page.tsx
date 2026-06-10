import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { navConfig } from "@/lib/feed";
import SettingsView from "@/components/SettingsView";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [me, nav] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, bio: true, image: true } as any }) as any,
    navConfig(user),
  ]);
  const isAdmin = user.role !== "MEMBER";
  return (<><TopBar isAdmin={isAdmin} nav={nav} /><SettingsView name={me?.name ?? ""} email={me?.email ?? ""} bio={me?.bio ?? ""} image={me?.image ?? ""} isAdmin={isAdmin} /></>);
}
