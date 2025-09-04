// lib/utils/adminGuard.ts
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER" | string;
};

/**
 * Use inside server components or API routes to enforce admin.
 * Returns { ok: true, user } when admin; otherwise an HTTP response.
 */
export async function requireAdmin():
  Promise<{ ok: true; user: AdminUser } | { ok: false; res: NextResponse }> {
  const session = (await getServerSession(authOptions)) as Session | null;
  const email = session?.user?.email ?? null;
  if (!email) {
    return {
      ok: false,
      res: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return {
      ok: false,
      res: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user: user as AdminUser };
}

// Backward-compat alias (old code still importing { adminGuard })
export const adminGuard = requireAdmin;
