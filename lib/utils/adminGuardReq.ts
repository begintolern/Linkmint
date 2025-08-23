// lib/utils/adminGuardReq.ts
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

export type AdminGate =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; reason: "Unauthorized" | "Forbidden" };

export async function adminGuardFromReq(req: Request): Promise<AdminGate> {
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email as string | undefined;
  if (!email) return { ok: false, status: 401, reason: "Unauthorized" };

  // Prefer role from token, fall back to DB
  const roleFromToken = (token as any)?.role;
  if (!roleFromToken || String(roleFromToken).toUpperCase() !== "ADMIN") {
    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!me) return { ok: false, status: 401, reason: "Unauthorized" };
    if (String(me.role).toUpperCase() !== "ADMIN") {
      return { ok: false, status: 403, reason: "Forbidden" };
    }
    return { ok: true, userId: me.id };
  }

  // Role looked good on the token—get id from DB quickly
  const me = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
  if (!me) return { ok: false, status: 401, reason: "Unauthorized" };
  return { ok: true, userId: me.id };
}
