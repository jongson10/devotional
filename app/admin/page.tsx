import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import AdminConsole from "@/components/AdminConsole";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (user.role === "MEMBER") redirect("/");
  return <AdminConsole />;
}
