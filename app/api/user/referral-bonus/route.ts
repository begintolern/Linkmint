// app/api/user/referral-bonus/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const jar = cookies();
    const email = jar.get("email")?.value ? decodeURIComponent(jar.get("email")!.value) : null;
    if (!email) {
      return NextResponse.json({ ok: false, error: "Not logged in" }, { status: 401 });
    }

    // Get user id + live referral count via relation _count (works even if columns don’t exist)
    const user = await prisma.user.findFirst({
      where: { email },
      select: {
        id: true,
        email: true,
        _count: { select: { referrals: true } },
      },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    // Try to read permanentOverrideBps / totalReferrals via raw SELECT (schema-agnostic)
    let permanentOverrideBps = 0;
    let totalReferralsColumn: number | null = null;

    try {
      const rows = await prisma.$queryRawUnsafe<
        Array<{ permanentOverrideBps?: number | null; totalReferrals?: number | null }>
      >('SELECT "permanentOverrideBps", "totalReferrals" FROM "User" WHERE id = $1 LIMIT 1;', user.id);

      if (rows?.length) {
        const r = rows[0] ?? {};
        if (typeof r.permanentOverrideBps === "number") permanentOverrideBps = r.permanentOverrideBps || 0;
        if (typeof r.totalReferrals === "number") totalReferralsColumn = r.totalReferrals ?? null;
      }
    } catch {
      // ignore if columns don’t exist yet
    }

    // Fall back to relation count for total referrals if column not present
    const totalReferrals = totalReferralsColumn ?? Number(user._count?.referrals ?? 0);

    // Compose response
    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      totals: {
        totalReferrals,
        permanentOverrideBps, // 100 bps = +1%
      },
      milestones: [
        { at: 15, bps: 100 },
        { at: 30, bps: 200 },
        { at: 60, bps: 300 },
        { at: 100, bps: 500 },
      ],
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
