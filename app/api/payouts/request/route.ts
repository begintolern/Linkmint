// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Provider = "PAYPAL"; // <-- Only PayPal

function isValidPaypalEmail(email?: string) {
  if (!email) return false;
  // Basic sanity: PayPal requires a valid email; you likely have deeper checks elsewhere.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const provider: Provider = "PAYPAL"; // <-- Force PAYPAL no matter what
    const destination: string | undefined = body?.destination ?? body?.receiverEmail;

    // Validate PayPal destination
    if (!isValidPaypalEmail(destination)) {
      return NextResponse.json(
        { success: false, error: "A valid PayPal email is required." },
        { status: 400 }
      );
    }

    // You may already compute gross/net; keep your existing logic
    const grossUSD: number = Number(body?.grossUSD ?? 0);
    if (!Number.isFinite(grossUSD) || grossUSD <= 0) {
      return NextResponse.json({ success: false, error: "Invalid payout amount." }, { status: 400 });
    }

    // Create payout record as usual
    const payout = await prisma.payout.create({
      data: {
        userId: session.user.id,
        provider: "PAYPAL",
        statusEnum: "PENDING",
        netCents: Math.round(grossUSD * 100),
        receiverEmail: destination,
      },
    });

    // (If you have a job/queue, enqueue here)
    return NextResponse.json({
      success: true,
      requestId: payout.id,
      provider: "PAYPAL",
      destination,
      grossUSD,
      netUSD: grossUSD,
      status: "PENDING",
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? "Server error" }, { status: 500 });
  }
}
