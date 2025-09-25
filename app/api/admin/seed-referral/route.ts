// app/api/admin/seed-referral/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

/**
 * Seeds a referral group for a given user (for testing/admin only)
 * POST body: { referrerId: string, inviteeEmails: string[] }
 */
export async function POST(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const body = (await req.json()) as { referrerId: string; inviteeEmails?: string[] };
    const referrerId = body.referrerId;
    const inviteeEmails = body.inviteeEmails ?? [];

    if (!referrerId) {
      return NextResponse.json({ success: false, error: "Missing referrerId" }, { status: 400 });
    }

    // Create invitees if not exist
    const invitees = await Promise.all(
      inviteeEmails.map(async (email) => {
        let u = await prisma.user.findUnique({ where: { email } });
        if (!u) {
          u = await prisma.user.create({
            data: { email, name: email.split("@")[0] },
          });
        }
        return u;
      })
    );

    // Create referral group
    const group = await prisma.referralGroup.create({
      data: {
        referrerId,
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        users: { connect: invitees.map((u) => ({ id: u.id })) },
      },
      include: { users: true, referrer: true },
    });

    return NextResponse.json({ success: true, group });
  } catch (err) {
    console.error("seed-referral error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

/**
 * GET /api/admin/seed-referral
 * Returns the last 20 referral groups for inspection
 */
export async function GET() {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const groups = await prisma.referralGroup.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        referrer: { select: { id: true, email: true } },
        users: { select: { id: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      groups: groups.map((g: { id: string; referrer: { email: string | null } | null; users: { email: string | null }[] }) => ({
        id: g.id,
        referrer: g.referrer?.email ?? "—",
        users: g.users.map((u) => u.email ?? "—"),
      })),
    });
  } catch (err) {
    console.error("seed-referral GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
