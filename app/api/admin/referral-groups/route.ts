// app/api/admin/referral-groups/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type AdminSession = Session & {
  user?: { id?: string; email?: string | null; name?: string | null; role?: string | null };
};

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as AdminSession | null;

    const email = session?.user?.email ?? null;
    if (!email) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const role = session?.user?.role ?? "USER";
    if (role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

    const rows = await prisma.referralGroup.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        startedAt: true,
        expiresAt: true,
        createdAt: true,
        referrer: { select: { id: true, email: true, name: true } },
        users: { select: { id: true, email: true, name: true } },
        _count: { select: { users: true } },
      },
    });

    // add derived countdown fields
    const now = Date.now();
    const data = rows.map((g) => {
      const startedMs = new Date(g.startedAt).getTime();
      const expiresMs = new Date(g.expiresAt).getTime();
      const msLeft = Math.max(0, expiresMs - now);
      const daysLeft = Math.floor(msLeft / 86_400_000);
      return { ...g, daysRemaining: daysLeft, active: expiresMs > now && startedMs <= now };
    });

    return NextResponse.json({ success: true, rows: data });
  } catch (err: any) {
    console.error("[admin/referral-groups] GET failed:", err?.message || err);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
