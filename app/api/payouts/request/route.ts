// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Body = {
  amount?: number; // USD
  provider?: "PAYPAL" | "PAYONEER";
  note?: string;
};

export async function POST(req: Request) {
  try {
    // ---- Auth ----
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, email: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // ---- Input ----
    const { amount, provider, note } = (await req.json()) as Body;

    if (!amount || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // ---- Find payout account ----
    const account = await prisma.payoutAccount.findFirst({
      where: {
        userId: me.id,
        ...(provider ? { provider } : { isDefault: true }),
      },
      select: {
        id: true,
        provider: true,
        externalId: true, // <-- your schema uses externalId (email for PayPal, etc.)
        label: true,
        isDefault: true,
        status: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { success: false, error: "No payout method on file. Please save one first." },
        { status: 400 }
      );
    }

    // Basic fee example (you can tune this later or make network-specific):
    // PayPal: 2.9% + $0.30, Payoneer: flat $1.50 placeholder
    const gross = Math.round(amount * 100); // cents
    let feeCents = 0;
    if (account.provider === "PAYPAL") {
      feeCents = Math.round(gross * 0.029) + 30;
    } else if (account.provider === "PAYONEER") {
      feeCents = 150;
    }
    const netCents = Math.max(0, gross - feeCents);

    // ---- Record request in PayoutLog (stable table) ----
    const log = await prisma.payoutLog.create({
      data: {
        userId: me.id,
        receiverEmail: account.externalId ?? null,
        amount: amount, // store USD amount for display
        note:
          note ??
          `Request payout via ${account.provider} (${account.label ?? "default"}) | gross=$${(
            gross / 100
          ).toFixed(2)} fee=$${(feeCents / 100).toFixed(2)} net=$${(netCents / 100).toFixed(2)}`,
        status: "REQUESTED",
      },
      select: { id: true },
    });

    return NextResponse.json({
      success: true,
      requestId: log.id,
      provider: account.provider,
      destination: account.externalId,
      grossUSD: amount,
      feeUSD: feeCents / 100,
      netUSD: netCents / 100,
    });
  } catch (err) {
    console.error("POST /api/payouts/request error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to submit payout request" },
      { status: 500 }
    );
  }
}
