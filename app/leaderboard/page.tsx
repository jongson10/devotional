import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import Leaderboard from "@/components/Leaderboard";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function LeaderboardPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><Leaderboard /></>);
}
