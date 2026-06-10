import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsView from "@/components/SettingsView";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const me: any = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, bio: true, image: true } as any });
  const isAdmin = user.role !== "MEMBER";
  return (<><TopBar isAdmin={isAdmin} /><SettingsView name={me?.name ?? ""} email={me?.email ?? ""} bio={me?.bio ?? ""} image={me?.image ?? ""} isAdmin={isAdmin} /></>);
}
