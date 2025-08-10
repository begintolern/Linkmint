import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const adminKey = req.headers.get("x-admin-key");
  if (adminKey !== process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Ensure a test user exists (Payout.userId is required)
    const user = await prisma.user.upsert({
      where: { email: "seed-tester@linkmint.co" },
      update: {},
      create: {
        email: "seed-tester@linkmint.co",
        name: "Seed Tester",
        emailVerified: true,
      },
    });

    // Create a payout row (this is your “payout log”)
    const payout = await prisma.payout.create({
      data: {
        userId: user.id,
        amount: 25.5,
        method: "paypal",
        status: "paid",
        details: "Seeded payout for API test",
        paidAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, payout });
  } catch (err) {
    console.error("Seed payout error:", err);
    return NextResponse.json({ success: false, error: "Failed to create test payout" }, { status: 500 });
  }
}
