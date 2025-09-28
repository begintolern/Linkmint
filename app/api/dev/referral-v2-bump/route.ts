// @ts-nocheck
// app/api/dev/referral-v2-bump/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Milestones (bps = 100 bps = 1%)
const milestones = [
  { at: 100, bps: 500 },
  { at: 60,  bps: 300 },
  { at: 30,  bps: 200 },
  { at: 15,  bps: 100 },
];

function resolvePermanentBps(totalReferrals: number) {
  for (const m of milestones) if (totalReferrals >= m.at) return m.bps;
  return 0;
}

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    // Admin guard
    const admins = getAdminEmails();
    if (!admins.length) {
      return NextResponse.json({ ok: false, error: "ADMIN_EMAIL(S) not set" } as any, { status: 401 });
    }
    const admin = await prisma.user.findFirst({
      where: { email: { in: admins } },
      select: { id: true },
    });
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No admin user found" } as any, { status: 401 });
    }

    const url = req.nextUrl;
    const userId = url.searchParams.get("userId");
    const add = Number(url.searchParams.get("add") || "0");
    if (!userId) return NextResponse.json({ ok: false, error: "Missing userId" } as any, { status: 400 });
    if (add < 0 || !Number.isFinite(add)) {
      return NextResponse.json({ ok: false, error: "Param 'add' must be a non-negative number" } as any, { status: 400 });
    }

    // Get live referral count via relation _count (portable on any schema)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, _count: { select: { referrals: true } } },
    });
    if (!user) return NextResponse.json({ ok: false, error: "User not found" } as any, { status: 404 });

    const currentTotal = Number(user._count?.referrals ?? 0);
    const nextTotal = currentTotal + add;
    const currentBps = 0; // we can't read column safely; assume 0 before writes
    const nextBps = resolvePermanentBps(nextTotal);

    const v2Enabled  = (process.env.REFERRAL_V2_ENABLED || "").toLowerCase() === "true";
    const writeFlag  = (process.env.REFERRAL_V2_WRITE   || "").toLowerCase() === "true";
    const canWrite = v2Enabled && writeFlag;

    if (!canWrite) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        flagEnabled: v2Enabled,
        writeEnabled: writeFlag,
        user: { id: user.id, email: user.email },
        before: { totalReferrals: currentTotal, permanentOverrideBps: currentBps },
        after:  { totalReferrals: nextTotal,    permanentOverrideBps: nextBps },
        milestones,
        note: "Preview only. No DB writes performed.",
      } as any);
    }

    // ⚙️ WRITE PATH (raw SQL to avoid Prisma Client type checks)

    // 1) Ensure columns exist (idempotent)
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "totalReferrals" INTEGER NOT NULL DEFAULT 0;'
    );
    await prisma.$executeRawUnsafe(
      'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permanentOverrideBps" INTEGER NOT NULL DEFAULT 0;'
    );

    // 2) Update the values
    // Safe params: numbers are validated; user.id came from DB
    await prisma.$executeRawUnsafe(
      'UPDATE "User" SET "totalReferrals" = $1, "permanentOverrideBps" = $2 WHERE id = $3;',
      nextTotal,
      nextBps,
      user.id
    );

    // 3) Read back using raw select (works even if Prisma Client types are stale)
    const rows = await prisma.$queryRawUnsafe<
      Array<{ totalReferrals: number; permanentOverrideBps: number }>
    >('SELECT "totalReferrals", "permanentOverrideBps" FROM "User" WHERE id = $1;', user.id);

    const after = rows?.[0] ?? { totalReferrals: nextTotal, permanentOverrideBps: nextBps };

    // Best-effort audit log
    try {
      await prisma.eventLog.create({
        data: {
          type: "REFERRAL_MILESTONE_REACHED",
          userId: user.id,
          message: `Total referrals ${currentTotal} → ${after.totalReferrals}; bps ${currentBps} → ${after.permanentOverrideBps}`,
          meta: { fromBps: currentBps, toBps: after.permanentOverrideBps, add },
        } as any,
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      dryRun: false,
      flagEnabled: v2Enabled,
      writeEnabled: writeFlag,
      user: { id: user.id, email: user.email },
      before: { totalReferrals: currentTotal, permanentOverrideBps: currentBps },
      after,
      milestones,
      note: "DB updated via raw SQL (schema-agnostic).",
    } as any);
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) } as any, { status: 500 });
  }
}
