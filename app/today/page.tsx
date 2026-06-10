import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { devotionalPayload } from "@/lib/feed";
import DailyFlow from "@/components/DailyFlow";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ dayId?: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { dayId } = await searchParams;
  const initial = await devotionalPayload(user, dayId ?? null);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><DailyFlow initial={initial} /></>);
}
