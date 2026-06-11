import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import { leaderboardRows, memberActivity } from "@/lib/feed";
import Community from "@/components/Community";
export const dynamic = "force-dynamic";
export default async function CommunityPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [name, rows, activity] = await Promise.all([churchName(user.churchId), leaderboardRows(user), memberActivity(user)]);
  return <Community churchName={name} initialRows={rows} initialActivity={activity} />;
}
