import { prisma } from "@/lib/prisma";
export async function churchName(churchId: string | null | undefined): Promise<string> {
  if (!churchId) return "Your church";
  const c = await prisma.church.findUnique({ where: { id: churchId }, select: { name: true } });
  return c?.name || "Your church";
}
