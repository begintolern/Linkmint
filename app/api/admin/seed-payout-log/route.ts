// app/api/admin/seed-payout-log/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST() {
  try {
    // Create (or reuse) a seeded user
    const user = await prisma.user.upsert({
      where: { email: "seed-tester@linkmint.co" },
      update: {},
      create: {
        email: "seed-tester@linkmint.co",
        name: "Seed Tester",
        // ✅ new schema uses timestamp, not boolean
        emailVerifiedAt: new Date(),
        role: "user",
        trustScore: 0,
      },
      select: { id: true, email: true },
    });

    // Create a sample payout + log entry
    await prisma.payout.create({
      data: {
        userId: user.id,
        amount: 25.0,
        method: "paypal",
        status: "queued",
        details: "seed payout",
      },
    });

    await prisma.eventLog.create({
      data: {
        type: "payout",
        message: "Seed payout queued",
        detail: "Seed script created a test payout for seed-tester@linkmint.co",
        userId: user.id,
      },
    });

    return NextResponse.json({ ok: true, user });
  } catch (err) {
    console.error("[seed-payout-log] error:", err);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
