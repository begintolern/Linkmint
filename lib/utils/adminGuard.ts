// lib/utils/adminGuard.ts
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type AdminGuardOk = { ok: true; userId: string };
type AdminGuardFail = { ok: false; status: 401 | 403; reason: "Unauthorized" | "Forbidden" };
export type AdminGuardResult = AdminGuardOk | AdminGuardFail;

/**
 * Server-side guard to verify the current user is an admin.
 * - Returns { ok: true, userId } when authorized
 * - Returns { ok: false, status, reason } when not
 */
export async function adminGuard(): Promise<AdminGuardResult> {
  const session = (await getServerSession(authOptions)) as Session | null;

  const email = session?.user?.email ?? null;
  if (!email) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }

  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (!me) {
    return { ok: false, status: 401, reason: "Unauthorized" };
  }

  // Normalize role casing (supports "admin" or "ADMIN", etc.)
  const role = (me.role ?? "").toString().toLowerCase();
  if (role !== "admin") {
    return { ok: false, status: 403, reason: "Forbidden" };
  }

  return { ok: true, userId: me.id };
}

/**
 * Assert admin in server components / route handlers.
 * Redirects away when not authorized to avoid partial renders.
 */
export async function assertAdmin(): Promise<void> {
  const res = await adminGuard();
  if (!res.ok) {
    if (res.status === 401) {
      // Not logged in → send to login
      redirect("/login");
    }
    // Logged in but not admin → send home (or a 403 page if you have one)
    redirect("/");
  }
}
