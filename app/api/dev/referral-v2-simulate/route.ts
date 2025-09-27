// app/api/dev/referral-v2-simulate/route.ts
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

// Margin floor in bps (15% = 1500 bps)
const PLATFORM_FLOOR_BPS = 1500;

function calcUserPayoutPct({
  baseBps,
  batchBps,
  permanentBps,
  platformFloorBps = PLATFORM_FLOOR_BPS,
}: {
  baseBps: number;
  batchBps: number;       // v1 temp override, e.g. 500
  permanentBps: number;   // v2 milestone bonus, e.g. 100..500
  platformFloorBps?: number;
}) {
  const bonusBps = batchBps + permanentBps;
  const rawBps = baseBps + bonusBps;
  const maxBps = 10000 - platformFloorBps; // never drop platform below floor
  const finalBps = Math.min(rawBps, maxBps);
  return { bonusBps, finalBps, capped: finalBps !== rawBps, capAtBps: maxBps };
}

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl;
    const userId = url.searchParams.get("userId");
    const sampleAmount = Number(url.searchParams.get("amount") || "10000"); // cents
    const baseBps = Number(url.searchParams.get("baseBps") || "5000");      // example 50%
    const batchBps = Number(url.searchParams.get("batchBps") || "500");     // example +5%

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Missing userId. Try ?userId=<id>&amount=10000&baseBps=5000&batchBps=500" },
        { status: 400 }
      );
    }

    // Count existing direct referrals (uses your existing self-relation)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        referrals: { select: { id: true } }, // direct invitees
      },
    });

    if (!user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const totalReferrals = user.referrals.length;
    const permanentBps = resolvePermanentBps(totalReferrals);

    // v1 (no permanent)
    const v1 = calcUserPayoutPct({ baseBps, batchBps, permanentBps: 0 });
    // v2 (with permanent)
    const v2 = calcUserPayoutPct({ baseBps, batchBps, permanentBps });

    const v1Payout = Math.round((sampleAmount * v1.finalBps) / 10000);
    const v2Payout = Math.round((sampleAmount * v2.finalBps) / 10000);

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email },
      inputs: { sampleAmount, baseBps, batchBps, platformFloorBps: PLATFORM_FLOOR_BPS },
      referrals: { totalReferrals, milestones, permanentBps },
      v1: { finalBps: v1.finalBps, capped: v1.capped, capAtBps: v1.capAtBps, payoutCents: v1Payout },
      v2: { finalBps: v2.finalBps, capped: v2.capped, capAtBps: v2.capAtBps, payoutCents: v2Payout },
      delta: { payoutCents: v2Payout - v1Payout, bps: v2.finalBps - v1.finalBps },
      note: "Read-only simulation. No DB writes.",
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
