import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import DailyFlow from "@/components/DailyFlow";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ dayId?: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { dayId } = await searchParams;
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><DailyFlow dayId={dayId ?? null} /></>);
}
