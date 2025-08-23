// app/api/payout-account/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const session = await (getServerSession as any)(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id as string;

    const { provider, externalId, label } = await req.json();
    if (!["PAYPAL", "PAYONEER"].includes(provider)) {
      return NextResponse.json({ success: false, error: "Invalid provider" }, { status: 400 });
    }
    if (!externalId || typeof externalId !== "string") {
      return NextResponse.json({ success: false, error: "Missing externalId" }, { status: 400 });
    }

    // Clear any existing default for this user
    await prisma.payoutAccount.updateMany({
      where: { userId },
      data: { isDefault: false },
    });

    // Upsert this account and set as default
    const acct = await prisma.payoutAccount.upsert({
      where: {
        // unique by (userId, provider, externalId)
        // emulate with composite unique you added in Prisma
        userId_provider_externalId: { userId, provider, externalId },
      } as any,
      create: { userId, provider, externalId, label: label ?? null, isDefault: true },
      update: { label: label ?? null, isDefault: true, status: "VERIFIED" },
      select: { id: true, provider: true, externalId: true, isDefault: true },
    });

    return NextResponse.json({ success: true, account: acct });
  } catch (e) {
    console.error("POST /api/payout-account error", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
