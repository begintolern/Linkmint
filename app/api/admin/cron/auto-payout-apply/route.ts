// app/api/admin/cron/auto-payout-apply/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAutoPayoutEnabled, isAutoDisburseEnabled } from "@/lib/config/flags";
import { calcSplit } from "@/lib/engines/payout/calcSplit";
import { isReferralActiveForPair } from "@/lib/referrals/isReferralActiveForPair";
import { Prisma } from "@prisma/client";

/** Admin key guard */
function requireAdmin(req: Request) {
  const key = req.headers.get("x-admin-key");
  if (!key || key !== process.env.ADMIN_API_KEY) {
    return new Response(JSON.stringify({ ok: false, error: "unauthorized" }), { status: 401 });
  }
  return null;
}

// Extract cents with schema flexibility
function extractGrossCents(c: any): number {
  if (typeof c?.grossCents === "number" && Number.isFinite(c.grossCents)) return c.grossCents;
  if (typeof c?.amountCents === "number" && Number.isFinite(c.amountCents)) return c.amountCents;
  if (typeof c?.netCents === "number" && Number.isFinite(c.netCents)) return c.netCents;
  const fromAmount = Number(c?.amount);
  if (Number.isFinite(fromAmount)) return Math.max(0, Math.floor(fromAmount * 100));
  return 0;
}

/**
 * GET /api/admin/cron/auto-payout-apply?take=50
 * - Honors AUTO_PAYOUT_ENABLED flag (must be true to write).
 * - Creates payout rows for eligible APPROVED commissions not yet paid.
 * - Does NOT hit payment providers unless AUTO_PAYOUT_DISBURSE_ENABLED is true (not implemented here).
 */
export async function GET(req: Request) {
  const unauthorized = requireAdmin(req);
  if (unauthorized) return unauthorized;

  try {
    // Safety gate: require flag ON to write
    if (!isAutoPayoutEnabled()) {
      return NextResponse.json(
        { ok: false, error: "auto_payout_disabled", autoPayoutEnabled: false },
        { status: 403 }
      );
    }

    const url = new URL(req.url);
    const take = Math.min(Math.max(parseInt(url.searchParams.get("take") || "50", 10), 1), 200);

    // Load APPROVED commissions (schema agnostic)
    const approved = await prisma.commission.findMany({
      take,
      where: { status: "APPROVED" as any },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userId: true,
        status: true,
        createdAt: true,
        amount: true,
        amountCents: true,
        netCents: true,
        grossCents: true,
      } as any,
    });

    if (!approved.length) {
      return NextResponse.json({
        ok: true,
        summary: {
          autoPayoutEnabled: true,
          autoDisburseEnabled: isAutoDisburseEnabled(),
          processed: 0,
          finalized: 0,
          skipped: 0,
        },
        items: [],
      });
    }

    // Exclude commissions already tied to a payout (payout.details contains "commission:<id>")
    const ids = approved.map(c => c.id);
    const existing = await prisma.payout.findMany({
      where: { details: { in: ids.map(id => `commission:${id}`) } },
      select: { id: true, details: true },
    });
    const alreadyPaidSet = new Set(
      existing.map(p => String(p.details || "")).map(d => d.replace("commission:", ""))
    );

    const pending = approved.filter(c => !alreadyPaidSet.has(c.id));

    const results: any[] = [];
    let finalized = 0;
    let skipped = 0;

    for (const c of pending) {
      const grossCents = extractGrossCents(c);
      if (!grossCents) {
        skipped++;
        results.push({ commissionId: c.id, status: "SKIP", reason: "no_amount_detected" });
        continue;
      }
      if (c.status !== "APPROVED") {
        skipped++;
        results.push({ commissionId: c.id, status: "SKIP", reason: "not_approved" });
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { id: c.userId },
        select: {
          id: true,
          referredById: true,
          referralGroupId: true,
          trustScore: true,
        },
      });
      if (!user) {
        skipped++;
        results.push({ commissionId: c.id, status: "SKIP", reason: "user_missing" });
        continue;
      }

      const referrerId = user.referredById || null;
      const isActive = referrerId
        ? await isReferralActiveForPair({ referrerId, inviteeId: user.id, now: new Date() })
        : false;

      const split = calcSplit({ grossCents, isReferralActive: Boolean(isActive) });

      // Build payout rows (no disbursement here)
      const details = `commission:${c.id}${isActive ? " (referral 5% active)" : ""}`;

      const payoutRows: Prisma.PayoutCreateManyInput[] = [
        {
          id: crypto.randomUUID(),
          userId: user.id,
          amount: split.inviteeCents / 100,
          method: "MANUAL",
          status: "READY_TO_PAY",
          details,
          feeCents: 0,
          netCents: split.inviteeCents,
          provider: null,
          receiverEmail: null,
          statusEnum: "PENDING" as any,
          transactionId: null,
          createdAt: new Date(),
        },
      ];

      if (split.referrerCents > 0 && referrerId) {
        payoutRows.push({
          id: crypto.randomUUID(),
          userId: referrerId,
          amount: split.referrerCents / 100,
          method: "MANUAL",
          status: "READY_TO_PAY",
          details,
          feeCents: 0,
          netCents: split.referrerCents,
          provider: null,
          receiverEmail: null,
          statusEnum: "PENDING" as any,
          transactionId: null,
          createdAt: new Date(),
        });
      }

      await prisma.payout.createMany({ data: payoutRows, skipDuplicates: true });

      finalized++;
      results.push({
        commissionId: c.id,
        status: "FINALIZED",
        appliedReferralBonus: split.appliedReferralBonus,
        inviteeCents: split.inviteeCents,
        referrerCents: split.referrerCents,
        platformCents: split.platformCents,
      });
    }

    return NextResponse.json({
      ok: true,
      summary: {
        autoPayoutEnabled: true,
        autoDisburseEnabled: isAutoDisburseEnabled(),
        processed: pending.length,
        finalized,
        skipped,
      },
      items: results,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}
