// app/api/payouts/request/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { quoteFeeCents } from "@/lib/payouts/fees";
import type { PayoutProvider } from "@prisma/client";

// TODO: replace with real approved-balance logic
async function getApprovedBalanceCents(userId: string) {
  return 5000; // $50.00 available (stub)
}

export async function POST(req: Request) {
  try {
    const session = await (getServerSession as any)(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const { amountCents, provider } = await req.json();
    if (!amountCents || amountCents <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }
    if (!provider || !["PAYPAL", "PAYONEER"].includes(provider)) {
      return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
    }

    // Ensure user has a default payout account for this provider
    const payoutAccount = await prisma.payoutAccount.findFirst({
      where: { userId, provider, isDefault: true },
      select: { id: true, externalId: true },
    });
    if (!payoutAccount) {
      return NextResponse.json(
        { success: false, error: `No default ${provider} payout account on file.` },
        { status: 400 }
      );
    }

    // Balance check
    const available = await getApprovedBalanceCents(userId);
    if (amountCents > available) {
      return NextResponse.json(
        { success: false, error: "Amount exceeds your available approved balance." },
        { status: 400 }
      );
    }

    // Fee + net
    const { feeCents, netCents } = quoteFeeCents(provider as PayoutProvider, amountCents);

    // Create payout (populate legacy + new fields)
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount: amountCents / 100,                // legacy float, keep for now
        method: provider,                         // legacy string
        status: "PENDING",                        // legacy string
        provider,                                 // new enum
        payoutAccountId: payoutAccount.id,
        feeCents,
        netCents,
        details: null,
      },
      select: {
        id: true, amount: true, feeCents: true, netCents: true,
        provider: true, status: true,
      },
    });

    return NextResponse.json({ success: true, payout });
  } catch (e) {
    console.error("POST /api/payouts/request error", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
