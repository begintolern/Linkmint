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

// Admin guard: read from env list (comma-separated)
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  try {
    // Admin check (must exist in DB)
    const admins = getAdminEmails();
    if (!admins.length) {
      return NextResponse.json({ ok: false, error: "ADMIN_EMAIL(S) not set" }, { status: 401 });
    }
    const admin = await prisma.user.findFirst({
      where: { email: { in: admins } },
      select: { id: true },
    });
    if (!admin) {
      return NextResponse.json({ ok: false, error: "No admin user found" }, { status: 401 });
    }

    const url = req.nextUrl;
    const userId = url.searchParams.get("userId");
    const add = Number(url.searchParams.get("add") || "0"); // how many verified invites to add (simulated / or real if flag ON)

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Missing userId. Use ?userId=<id>&add=3" }, { status: 400 });
    }
    if (add < 0 || !Number.isFinite(add)) {
      return NextResponse.json({ ok: false, error: "Param 'add' must be a non-negative number" }, { status: 400 });
    }

    // Loosen typing to tolerate older Prisma client types (dev-only route)
    const user = (await prisma.user.findUnique({
      where: { id: userId },
    })) as any;

    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const currentTotal = Number(user.totalReferrals ?? 0);
    const nextTotal = currentTotal + add;
    const currentBps = Number(user.permanentOverrideBps ?? 0);
    const nextBps = resolvePermanentBps(nextTotal);

    const enabled = (process.env.REFERRAL_V2_ENABLED || "").toLowerCase() === "true";

    if (!enabled) {
      // Read-only preview while flag is OFF
      return NextResponse.json({
        ok: true,
        dryRun: true,
        flagEnabled: false,
        user: { id: user.id, email: user.email },
        before: { totalReferrals: currentTotal, permanentOverrideBps: currentBps },
        after:  { totalReferrals: nextTotal,    permanentOverrideBps: nextBps },
        milestones,
        note: "Flag OFF: preview only. No DB writes performed.",
      });
    }

    // If flag is ON, persist the bump and milestone (safe: additive only)
    const updated = (await prisma.user.update({
      where: { id: user.id },
      data: {
        totalReferrals: nextTotal,
        permanentOverrideBps: nextBps,
      } as any, // tolerate older client types
    })) as any;

    // Audit log (best-effort)
    try {
      await prisma.eventLog.create({
        data: {
          type: "REFERRAL_MILESTONE_REACHED",
          userId: user.id,
          message: `Total referrals ${currentTotal} → ${nextTotal}; bps ${currentBps} → ${nextBps}`,
          meta: { fromBps: currentBps, toBps: nextBps, add },
        } as any,
      });
    } catch {}

    return NextResponse.json({
      ok: true,
      dryRun: false,
      flagEnabled: true,
      user: { id: updated.id, email: updated.email },
      before: { totalReferrals: currentTotal, permanentOverrideBps: currentBps },
      after:  { totalReferrals: Number(updated.totalReferrals ?? nextTotal), permanentOverrideBps: Number(updated.permanentOverrideBps ?? nextBps) },
      milestones,
      note: "Flag ON: DB updated.",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
