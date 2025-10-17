// app/api/ops/dev-create-referral-group/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Dev helper: create/refresh an active referral group.
 * Usage (GET):
 *   /api/ops/dev-create-referral-group?referrerId=R&inviteeId=I
 * Optional:
 *   &days=90  (defaults to 90)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const referrerId = searchParams.get("referrerId");
    const inviteeId = searchParams.get("inviteeId");
    const days = Math.max(1, Number(searchParams.get("days") ?? 90));

    if (!referrerId || !inviteeId) {
      return NextResponse.json(
        { ok: false, error: "Missing referrerId or inviteeId" },
        { status: 400 }
      );
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + days * 24 * 60 * 60 * 1000);

    // Create a fresh group; you can also upsert if you prefer
    const group = await prisma.referralGroup.create({
      data: {
        referrerId,
        startedAt,
        expiresAt,
        users: { connect: [{ id: inviteeId }] }, // add invitee to this group
      },
      include: { users: { select: { id: true } } },
    });

    return NextResponse.json({ ok: true, group });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}
