// lib/utils/adminGuard.ts
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function adminGuard() {
  const session = (await getServerSession(authOptions)) as Session | null;

  const email = session?.user?.email ?? null;
  if (!email) {
    return { ok: false as const, status: 401, reason: "Unauthorized" as const };
  }

  // Resolve role via DB to avoid relying on session augmentation types
  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!me) {
    return { ok: false as const, status: 401, reason: "Unauthorized" as const };
  }
  if (String(me.role).toUpperCase() !== "ADMIN") {
    return { ok: false as const, status: 403, reason: "Forbidden" as const };
  }

  return { ok: true as const, userId: me.id };
}
