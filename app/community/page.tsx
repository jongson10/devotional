import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import Community from "@/components/Community";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function CommunityPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const name = await churchName(user.churchId);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><Community churchName={name} /></>);
}
