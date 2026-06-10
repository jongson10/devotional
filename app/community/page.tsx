import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import { leaderboardRows, memberActivity } from "@/lib/feed";
import Community from "@/components/Community";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function CommunityPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [name, rows, activity] = await Promise.all([churchName(user.churchId), leaderboardRows(user), memberActivity(user)]);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><Community churchName={name} initialRows={rows} initialActivity={activity} /></>);
}
