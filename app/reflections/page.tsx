import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import { reflectionsFeed, navConfig } from "@/lib/feed";
import ReflectionsFeed from "@/components/ReflectionsFeed";
import TopBar from "@/components/TopBar";
export const dynamic = "force-dynamic";
export default async function ReflectionsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [name, items, nav] = await Promise.all([churchName(user.churchId), reflectionsFeed(user), navConfig(user)]);
  return (<><TopBar isAdmin={user.role !== "MEMBER"} nav={nav} /><ReflectionsFeed churchName={name} initial={items} /></>);
}
