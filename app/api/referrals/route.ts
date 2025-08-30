// app/api/referrals/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { ensureBatchesFor } from "@/lib/referrals/createReferralBatch";
import { syncTrustFromReferrals } from "@/lib/referrals/syncTrustFromReferrals";
import { prisma } from "@/lib/db";

function daysLeft(until: Date | null | undefined) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function computeStatus(expiresAt?: Date | null) {
  if (!expiresAt) return "UNKNOWN";
  return expiresAt.getTime() >= Date.now() ? "ACTIVE" : "EXPIRED";
}

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const inviterId = session.user.id;

    // Form any full groups and get current state
    const { groups, ungroupedCount } = await ensureBatchesFor(inviterId);

    // TrustScore sync (idempotent) + read back current value for debug
    const trustSync = await syncTrustFromReferrals(inviterId);
    const me = await prisma.user.findUnique({
      where: { id: inviterId },
      select: { trustScore: true, email: true, referralBadge: true },
    });

    const result = groups.map((g) => {
      const status = computeStatus(g.expiresAt);
      return {
        id: g.id,
        status,
        startedAt: g.startedAt ?? null,
        expiresAt: g.expiresAt ?? null,
        daysRemaining: daysLeft(g.expiresAt),
        members: g.users.map((u) => u.email),
      };
    });

    return NextResponse.json({
      success: true,
      ungroupedInvitees: ungroupedCount,
      groups: result,
      badge: me?.referralBadge ?? null, // <- added

      // ----- Debug fields (safe to keep for now) -----
      debug: {
        inviterId,
        inviterEmail: me?.email ?? null,
        batchCountAfter: trustSync.batchCount ?? null,
        trustScoreAfter: me?.trustScore ?? null,
        trustSyncUpdated: trustSync.updated ?? false,
      },
    });
  } catch (error) {
    console.error("GET /api/referrals error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load referrals" },
      { status: 500 }
    );
  }
}
