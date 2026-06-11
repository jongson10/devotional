import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import { prayerRoom } from "@/lib/feed";
import PrayerRoom from "@/components/PrayerRoom";
export const dynamic = "force-dynamic";
export default async function PrayerPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [name, prayers] = await Promise.all([churchName(user.churchId), prayerRoom(user)]);
  return <PrayerRoom churchName={name} initial={prayers} />;
}
