// app/api/payouts/request/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Provider = "PAYPAL" | "PAYONEER";

function redactDb(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return {
      protocol: u.protocol.replace(/:$/, ""),
      host: u.host,
      database: u.pathname.slice(1),
      user: u.username ? "***" : null,
    };
  } catch {
    return { raw: "***" };
  }
}

// Debug helper (GET): see which DB this route reads + last few payouts
export async function GET() {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });
    if (!me) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const db = redactDb(process.env.DATABASE_URL);
    const recent = await prisma.payout.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, createdAt: true, statusEnum: true, provider: true, netCents: true },
    });
    return NextResponse.json({ ok: true, db, payoutsCount: recent.length, recent });
  } catch {
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // auth
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, email: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // input
    const { provider, amount } = await req.json();
    const prov = String(provider || "").toUpperCase() as Provider;
    const amt = Number(amount);
    if (!["PAYPAL", "PAYONEER"].includes(prov)) {
      return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400 });
    }

    // ensure default payout account
    const acct = await prisma.payoutAccount.findFirst({
      where: { userId: me.id, provider: prov as any, isDefault: true },
      select: { externalId: true },
    });
    if (!acct) {
      return NextResponse.json(
        { success: false, error: "No default payout account for selected provider" },
        { status: 400 }
      );
    }

    // compute cents/fees
    const amountCents = Math.round(amt * 100);
    const feeCents = 0;
    const netCents = amountCents - feeCents;

    // ✅ Create payout (string fields `method` and `status` are required by your schema)
    const payout = await prisma.payout.create({
      data: {
        userId: me.id,
        // required string fields
        method: prov,                 // e.g., "PAYPAL" or "PAYONEER"
        status: "PENDING",
        // your existing fields
        statusEnum: "PENDING" as any, // enum mirror
        provider: prov as any,
        amount: amt,                  // Float in your schema
        netCents,                     // Int in your schema
        receiverEmail: acct.externalId,
      },
      select: {
        id: true,
        statusEnum: true,
        provider: true,
        receiverEmail: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      requestId: payout.id,
      provider: payout.provider,
      destination: payout.receiverEmail,
      grossUSD: amt,
      netUSD: netCents / 100,
      status: payout.statusEnum,
    });
  } catch (e) {
    console.error("POST /api/payouts/request error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
