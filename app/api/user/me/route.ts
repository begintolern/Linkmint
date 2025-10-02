// app/api/user/me/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { PayoutProvider } from "@prisma/client";

export async function GET() {
  const session = (await getServerSession(authOptions)) as Session | null;

  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        countryCode: true,
      },
    });

    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Prefer the default PayPal payout account (externalId = PayPal email)
    const payout = await prisma.payoutAccount.findFirst({
      where: { userId: user.id, provider: PayoutProvider.PAYPAL },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      select: { externalId: true },
    });

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? "",
        paypalEmail: payout?.externalId ?? "",
        role: user.role ?? "user",
        countryCode: user.countryCode ?? "PH",
        market: null, // market is handled client-side via cookie
      },
    });
  } catch (e) {
    console.error("[/api/user/me] error:", e);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
