// lib/utils/adminGuard.ts
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER" | string;
};

/**
 * Call at the top of admin pages/server components.
 * Redirects to /login (unauth) or /dashboard (non-admin).
 * Returns the user row when admin.
 */
export async function assertAdmin(): Promise<AdminUser> {
  const session = (await getServerSession(authOptions)) as Session | null;

  const email = session?.user?.email ?? null;
  if (!email) redirect("/login?next=/admin");

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return user as AdminUser;
}
