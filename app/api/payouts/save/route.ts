// app/api/payouts/save/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Body = {
  provider?: "PAYPAL" | "PAYONEER";
  email?: string;   // PayPal email OR Payoneer recipient email/ID
  label?: string;
};

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const { provider, email, label } = (await req.json()) as Body;
    if (!provider || !["PAYPAL", "PAYONEER"].includes(provider)) {
      return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
    }
    if (!email || typeof email !== "string") {
      return NextResponse.json({ success: false, error: "Missing payout email/ID" }, { status: 400 });
    }

    // Clear current default
    await prisma.payoutAccount.updateMany({
      where: { userId: me.id, isDefault: true },
      data: { isDefault: false },
    });

    // Find existing account by (userId, provider, externalId)
    const existing = await prisma.payoutAccount.findFirst({
      where: { userId: me.id, provider, externalId: email },
      select: { id: true },
    });

    let acct;
    if (existing) {
      acct = await prisma.payoutAccount.update({
        where: { id: existing.id },
        data: { label: label ?? null, isDefault: true, status: "VERIFIED", externalId: email },
        select: {
          id: true, provider: true, externalId: true, label: true, isDefault: true, status: true,
        },
      });
    } else {
      acct = await prisma.payoutAccount.create({
        data: {
          userId: me.id,
          provider,
          externalId: email,
          label: label ?? null,
          isDefault: true,
          status: "VERIFIED",
        },
        select: {
          id: true, provider: true, externalId: true, label: true, isDefault: true, status: true,
        },
      });
    }

    return NextResponse.json({ success: true, account: acct });
  } catch (e) {
    console.error("POST /api/payouts/save error:", e);
    return NextResponse.json({ success: false, error: "Failed to save payout method" }, { status: 500 });
  }
}
