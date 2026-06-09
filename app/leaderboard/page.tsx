import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { leaderboardRows } from "@/lib/feed";
import Leaderboard from "@/components/Leaderboard";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function LeaderboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const rows = await leaderboardRows(user);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><Leaderboard initialRows={rows} /></>);
}
