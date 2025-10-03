export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { ensureBatchesFor } from "@/lib/referrals/createReferralBatch";
import { syncTrustFromReferrals } from "@/lib/referrals/syncTrustFromReferrals";

function daysLeft(until: Date | null | undefined) {
  if (!until) return null;
  const ms = new Date(until).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function computeStatus(expiresAt?: Date | null) {
  if (!expiresAt) return "UNKNOWN";
  return expiresAt.getTime() >= Date.now() ? "ACTIVE" : "EXPIRED";
}

type GroupUser = { email: string | null };
type Group = {
  id: string;
  startedAt: Date | null;
  expiresAt: Date | null;
  users: GroupUser[];
};

export async function GET(req: NextRequest) {
  try {
    // 1) JWT from cookie (works for API routes)
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // 2) Try to determine inviterId
    let inviterId: string | undefined =
      (token?.sub as string | undefined) ?? undefined;

    // Try uid cookies your app sometimes sets
    if (!inviterId) {
      inviterId =
        req.cookies.get("uid")?.value ||
        req.cookies.get("userId")?.value ||
        undefined;
    }

    // 3) Fallback: look up user by email
    //    (use JWT email first, then 'email' cookie your app sets)
    let emailForLookup: string | undefined =
      (token?.email as string | undefined) ||
      req.cookies.get("email")?.value ||
      undefined;

    if (!inviterId && emailForLookup) {
      const u = await prisma.user.findUnique({
        where: { email: emailForLookup },
        select: { id: true },
      });
      inviterId = u?.id;
    }

    if (!inviterId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Ensure any full groups and get current state
    const ensured = (await ensureBatchesFor(inviterId)) as {
      groups: Group[];
      ungroupedCount: number;
    };

    // Idempotent trust sync + current state
    const trustSync = await syncTrustFromReferrals(inviterId);
    const me = await prisma.user.findUnique({
      where: { id: inviterId },
      select: {
        trustScore: true,
        email: true,
        referralBadge: true,
        referralCode: true,
      },
    });

    const result = ensured.groups.map((g: Group) => {
      const status = computeStatus(g.expiresAt);
      return {
        id: g.id,
        status,
        startedAt: g.startedAt ?? null,
        expiresAt: g.expiresAt ?? null,
        daysRemaining: daysLeft(g.expiresAt),
        members: g.users.map((u: GroupUser) => u.email),
      };
    });

    return NextResponse.json({
      success: true,
      ungroupedInvitees: ensured.ungroupedCount,
      groups: result,
      badge: me?.referralBadge ?? null,
      referralCode: me?.referralCode ?? null,
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
