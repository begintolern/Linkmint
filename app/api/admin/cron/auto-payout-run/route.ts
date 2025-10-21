// app/api/admin/cron/auto-payout-run/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAutoPayoutEnabled, isAutoDisburseEnabled } from "@/lib/config/flags";
import { calcSplit } from "@/lib/engines/payout/calcSplit";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";

/** Admin key guard */
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

/** Robust cents extractor from varying commission schemas */
function extractGrossCents(c: any): number {
  // Prefer explicit cents fields if present
  if (typeof c?.grossCents === "number" && Number.isFinite(c.grossCents)) return c.grossCents;
  if (typeof c?.amountCents === "number" && Number.isFinite(c.amountCents)) return c.amountCents;
  if (typeof c?.netCents === "number" && Number.isFinite(c.netCents)) return c.netCents;

  // Else fall back to dollar fields * 100
  const fromAmount = Number(c?.amount);
  if (Number.isFinite(fromAmount)) return Math.max(0, Math.floor(fromAmount * 100));

  // Last resort: zero
  return 0;
}

/**
 * GET /api/admin/cron/auto-payout-run?take=50&dryRun=1
 * - Always read-only. Returns a preview of who WOULD be paid, and how much.
 * - Honors feature flags; if flags are OFF, still previews but clearly marks "disabled".
 */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get("take") || "50", 10), 1), 200);
    const dryRun = url.searchParams.get("dryRun") === "1" || true; // this endpoint is preview-only

    // 1) Load recent APPROVED commissions (schema-agnostic select)
    const commissions = await prisma.commission.findMany({
      take,
      where: {
        // If your schema uses an enum, "APPROVED" maps fine; else it's a string match.
        status: "APPROVED" as any,
      },
      orderBy: { createdAt: "desc" as const },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        // flexible numeric fields:
        amount: true,
        amountCents: true,
        netCents: true,
        grossCents: true,
      } as any,
    });

    if (!commissions.length) {
      return NextResponse.json({
        ok: true,
        summary: {
          autoPayoutEnabled: isAutoPayoutEnabled(),
          autoDisburseEnabled: isAutoDisburseEnabled(),
          dryRun: true,
          examined: 0,
          eligible: 0,
          reason: "no_approved_commissions_found",
        },
        items: [],
      });
    }

    // 2) Exclude commissions already tied to a payout (details contains "commission:<id>")
    const ids = commissions.map(c => c.id);
    const existing = await prisma.payout.findMany({
      where: { details: { in: ids.map(id => `commission:${id}`) } },
      select: { id: true, details: true },
    });

    const alreadyPaidSet = new Set(
      existing
        .map(p => String(p.details || ""))
        .filter(Boolean)
        .map(d => d.replace("commission:", ""))
    );

    const pending = commissions.filter(c => !alreadyPaidSet.has(c.id));

    // 3) Simulate readiness checks & compute splits
    const items = [];
    for (const c of pending) {
      const grossCents = extractGrossCents(c);
      if (!grossCents) {
        items.push({
          commissionId: c.id,
          userId: c.userId,
          createdAt: c.createdAt,
          status: "SKIP",
          reason: "no_amount_detected",
        });
        continue;
      }

      // Minimal example readiness gates.
      // You can extend with: honeymoon hold, trust score, float, affiliate-cleared funds, payout method present, etc.
      const user = await prisma.user.findUnique({
        where: { id: c.userId },
        select: {
          id: true,
          referredById: true,
          referralGroupId: true,
          trustScore: true,
        },
      });

      // Referral window check (5% transfer from invitee if active)
      const referrerId = user?.referredById || null;
      const isActive = referrerId
        ? await isReferralActiveForPair({ referrerId, inviteeId: user!.id, now: new Date() })
        : false;

      const split = calcSplit({
        grossCents,
        isReferralActive: Boolean(isActive),
      });

      // Very simple readiness flags for preview:
      const flags = {
        approved: c.status === "APPROVED",
        amountPresent: grossCents > 0,
        // Placeholders you can integrate later:
        honeymoonPassed: true,
        trustScoreOk: (user?.trustScore ?? 0) >= 0,
        payoutMethodPresent: true, // set to actual check later
        floatAvailable: true,      // set to actual check later
        affiliateFundsCleared: true, // set to actual check later
        duplicatePayout: false,
      };

      const allGreen = Object.values(flags).every(Boolean);

      items.push({
        commissionId: c.id,
        userId: c.userId,
        createdAt: c.createdAt,
        status: allGreen ? "READY" : "BLOCKED",
        flags,
        preview: {
          grossCents,
          inviteeCents: split.inviteeCents,
          referrerCents: split.referrerCents,
          platformCents: split.platformCents,
          appliedReferralBonus: split.appliedReferralBonus,
        },
      });
    }

    const eligible = items.filter(i => i.status === "READY").length;

    return NextResponse.json({
      ok: true,
      summary: {
        autoPayoutEnabled: isAutoPayoutEnabled(),
        autoDisburseEnabled: isAutoDisburseEnabled(),
        dryRun: true, // this endpoint never writes
        examined: pending.length,
        eligible,
      },
      items,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}
