// app/api/user/commissions/summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: token.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Buckets
    let pending = 0;
    let approved = 0;   // commissions-only (legacy)
    let processing = 0; // payouts
    let paid = 0;
    let failed = 0;     // payouts

    // 1) Legacy commission-based balances (if still used anywhere)
    const commissions = await prisma.commission.findMany({
      where: { userId: user.id },
      select: { amount: true, status: true },
    });

    for (const c of commissions) {
      const amt = Number(c.amount ?? 0);
      const s = (c.status ?? "").toLowerCase();
      if (s === "pending") pending += amt;
      else if (s === "approved") approved += amt;
      else if (s === "paid") paid += amt;
    }

    // 2) Payout-based balances (current flow)
    const payouts = await prisma.payout.findMany({
      where: { userId: user.id },
      select: { amount: true, status: true },
    });

    for (const p of payouts) {
      const amt = Number(p.amount ?? 0);
      const s = (p.status ?? "").toLowerCase();
      if (s === "pending") pending += amt;
      else if (s === "processing") processing += amt;
      else if (s === "paid") paid += amt;
      else if (s === "failed") failed += amt;
    }

    return NextResponse.json({ pending, approved, processing, paid, failed });
  } catch (error) {
    console.error("Error fetching commission summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
