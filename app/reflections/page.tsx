import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { churchName } from "@/lib/church";
import { reflectionsFeed } from "@/lib/feed";
import ReflectionsFeed from "@/components/ReflectionsFeed";
export const dynamic = "force-dynamic";
export default async function ReflectionsPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  const [name, items] = await Promise.all([churchName(user.churchId), reflectionsFeed(user)]);
  return <ReflectionsFeed churchName={name} initial={items} />;
}
