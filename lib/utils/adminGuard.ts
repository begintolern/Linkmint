// lib/utils/adminGuard.ts
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export type AdminGate =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; reason: "Unauthorized" | "Forbidden" };

export async function adminGuard(): Promise<AdminGate> {
  const session = (await getServerSession(authOptions)) as Session | null;

  const email = session?.user?.email ?? null;
  if (!email) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }

  // Resolve role via DB to avoid relying only on session augmentation
  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!me) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }
  if (String(me.role).toUpperCase() !== "ADMIN") {
    return { ok: false, status: 403, reason: "Forbidden" };
  }

  return { ok: true, userId: me.id };
}

// Export an alias for compatibility with callers expecting `assertProdAdmin`
export { adminGuard as assertProdAdmin };
