import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { leaderboardRows, navConfig } from "@/lib/feed";
import Leaderboard from "@/components/Leaderboard";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function LeaderboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [rows, nav] = await Promise.all([leaderboardRows(user), navConfig(user)]);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} nav={nav} /><Leaderboard initialRows={rows} /></>);
}
