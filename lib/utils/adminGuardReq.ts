// lib/utils/adminGuardReq.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export type AdminUser = {
  id: string;
  email: string;
  role: "ADMIN" | "USER" | string;
};

/**
 * Use inside API route handlers to enforce admin.
 * Returns { ok: true, user } when admin; otherwise an HTTP response.
 */
export async function requireAdminFromReq(req: NextRequest):
  Promise<{ ok: true; user: AdminUser } | { ok: false; res: NextResponse }> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email;
  if (!email) {
    return { ok: false, res: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return { ok: false, res: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true, user: user as AdminUser };
}
