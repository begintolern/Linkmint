// app/api/seed-referral/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

// Minimal type for referral group seeding
type Group = {
  id: string;
  startedAt: Date | null;
  expiresAt: Date | null;
  referrerId: string | null;
};

export async function POST() {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json(
      { success: false, error: gate.reason },
      { status: gate.status }
    );
  }

  try {
    // Seed a fake referral referrer + users
    const referrer = await prisma.user.create({
      data: {
        email: `referrer_${Date.now()}@test.local`,
        trustScore: 50,
      },
    });

    const invitees = await Promise.all(
      Array.from({ length: 3 }).map((_, i) =>
        prisma.user.create({
          data: {
            email: `invitee${i}_${Date.now()}@test.local`,
            referredById: referrer.id,
          },
        })
      )
    );

    const group = await prisma.referralGroup.create({
      data: {
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 90 * 86_400_000),
        referrerId: referrer.id,
        users: {
          connect: invitees.map((u) => ({ id: u.id })),
        },
      },
      include: { users: true, referrer: true },
    });

    const groups = await prisma.referralGroup.findMany({
      include: { users: true, referrer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      ok: true,
      created: group.id,
      groups: groups.map((g: Group) => ({
        id: g.id,
        startedAt: g.startedAt,
        expiresAt: g.expiresAt,
        referrerId: g.referrerId,
      })),
    });
  } catch (err: any) {
    console.error("POST /api/seed-referral error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
