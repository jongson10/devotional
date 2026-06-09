import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/lib/prisma";

const emailServer = process.env.EMAIL_SERVER || "smtp://user:pass@localhost:587";

export const { handlers, auth, signIn, signOut } = NextAuth(() => ({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  pages: { signIn: "/login", verifyRequest: "/login?check=1" },
  providers: [
    Nodemailer({ server: emailServer, from: process.env.EMAIL_FROM || "Devotional <onboarding@resend.dev>" }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        const u = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, churchId: true, name: true },
        });
        (session.user as any).id = user.id;
        (session.user as any).role = u?.role ?? "MEMBER";
        (session.user as any).churchId = u?.churchId ?? null;
        if (u?.name) session.user.name = u.name;
      }
      return session;
    },
  },
}));

export async function requireUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user as {
    id: string; email?: string | null; name?: string | null;
    role: "MEMBER" | "ADMIN" | "OWNER"; churchId: string | null;
  };
}
export async function requireAdmin() {
  const u = await requireUser();
  if (!u || (u.role !== "ADMIN" && u.role !== "OWNER")) return null;
  return u;
}
