// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type SessionLike = {
  user?: {
    id?: string | null;
    email?: string | null;
  };
} | null;

function isValidPaypalEmail(email?: string) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as SessionLike;
    const userId = session?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({} as any));

    // Force PayPal-only
    const destination: string | undefined =
      body?.destination ?? body?.receiverEmail;

    if (!isValidPaypalEmail(destination)) {
      return NextResponse.json(
        { success: false, error: "A valid PayPal email is required." },
        { status: 400 }
      );
    }

    const grossUSDNum = Number(body?.grossUSD ?? 0);
    if (!Number.isFinite(grossUSDNum) || grossUSDNum <= 0) {
      return NextResponse.json(
        { success: false, error: "Invalid payout amount." },
        { status: 400 }
      );
    }

    const amountCents = Math.round(grossUSDNum * 100);

    // IMPORTANT: No enum imports — use string literals to match String fields
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount: amountCents,          // required by your schema
        method: "PAYPAL",             // String in schema
        status: "PENDING",            // String in schema
        provider: "PAYPAL",           // keep if your model has this (String)
        netCents: amountCents,        // keep if exists
        receiverEmail: destination!,  // required email
      },
    });

    return NextResponse.json({
      success: true,
      requestId: payout.id,
      provider: "PAYPAL",
      destination,
      grossUSD: grossUSDNum,
      netUSD: grossUSDNum,
      status: "PENDING",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message ?? "Server error" },
      { status: 500 }
    );
  }
}
