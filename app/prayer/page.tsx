import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import PrayerRoom from "@/components/PrayerRoom";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function PrayerPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  return (<><TopBar isAdmin={user.role !== "MEMBER"} /><PrayerRoom /></>);
}
