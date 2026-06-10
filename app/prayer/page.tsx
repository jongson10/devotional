import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import { prayerRoom, navConfig } from "@/lib/feed";
import PrayerRoom from "@/components/PrayerRoom";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function PrayerPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [name, prayers, nav] = await Promise.all([churchName(user.churchId), prayerRoom(user), navConfig(user)]);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} nav={nav} /><PrayerRoom churchName={name} initial={prayers} /></>);
}
