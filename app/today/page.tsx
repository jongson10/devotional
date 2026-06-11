import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { devotionalPayload, navConfig } from "@/lib/feed";
import DailyFlow from "@/components/DailyFlow";
export const dynamic = "force-dynamic";
export default async function TodayPage({ searchParams }: { searchParams: Promise<{ dayId?: string }> }) {
  const user = await requireUser();
  if (!user) redirect("/login");
  const { dayId } = await searchParams;
  const [initial, nav] = await Promise.all([devotionalPayload(user, dayId ?? null), navConfig(user)]);
  return <DailyFlow initial={initial} nav={nav} />;
}
