import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import JoinView from "@/components/JoinView";
export const dynamic = "force-dynamic";
export default async function JoinPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { code } = await searchParams;
  const user = await requireUser();
  if (!user) redirect(code ? `/login?code=${encodeURIComponent(code)}` : "/login");
  if (user.churchId) redirect("/");
  const normalized = (code ?? "").trim().toUpperCase();
  if (normalized) {
    const church = await prisma.church.findFirst({ where: { joinCode: normalized } as any, select: { id: true } });
    if (church) {
      await prisma.user.update({ where: { id: user.id }, data: { churchId: church.id } });
      redirect("/");
    }
  }
  return <JoinView initialCode={normalized} invalid={!!normalized} />;
}
