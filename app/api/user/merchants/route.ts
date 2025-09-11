// app/api/user/merchants/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    // NOTE: We’re returning the public merchant rules (no user-specific join yet).
    // If later you want per-user eligibility, add a join here.
    const merchants = await prisma.merchantRule.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        domain: true,
        network: true,
        status: true,          // "ACTIVE" | "PENDING" | "REJECTED"
        commissionType: true,  // e.g., "PERCENT" | "FIXED"
        commissionRate: true,  // e.g., 0.65 for 65%
        cookieDays: true,
        payoutDelayDays: true,
        notes: true,
        allowed: true,
        disallowed: true,
      },
    });

    return NextResponse.json({ merchants });
  } catch (err: any) {
    console.error("[api/user/merchants] error:", err);
    return NextResponse.json({ error: "Failed to fetch merchants" }, { status: 500 });
  }
}
