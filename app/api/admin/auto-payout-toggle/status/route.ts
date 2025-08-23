// app/api/admin/auto-payout-toggle/status/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

export async function GET(req: Request) {
  try {
    // Read NextAuth JWT directly from cookies
    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check (read from token first, fall back to DB if needed)
    const role = (token as any).role ?? null;
    if (String(role || "").toUpperCase() !== "ADMIN") {
      // fallback: check DB in case token lacks role
      const me = await prisma.user.findUnique({
        where: { email: token.email as string },
        select: { role: true },
      });
      if (!me || String(me.role).toUpperCase() !== "ADMIN") {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    // Return current toggle value
    const key = "autoPayoutEnabled";
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    const value = row?.value === "true";

    return NextResponse.json({ success: true, value });
  } catch (err) {
    console.error("auto-payout-toggle/status GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
