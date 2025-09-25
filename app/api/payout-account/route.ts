export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type MaybeSession = { user?: { id?: string | null } } | null;

export async function GET() {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const acct = await prisma.payoutAccount.findFirst({
    where: { userId, isDefault: true },
    select: { provider: true, externalId: true, label: true },
  });

  if (!acct) return NextResponse.json({ success: true, data: null });

  return NextResponse.json({
    success: true,
    data: {
      provider: acct.provider,
      email: acct.externalId,
      label: acct.label ?? "Default",
    },
  });
}

export async function POST(req: Request) {
  const session = (await getServerSession(authOptions)) as MaybeSession;
  const userId = session?.user?.id ?? null;
  if (!userId) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    provider?: string;
    email?: string;
    label?: string;
  };

  const provider = body?.provider;
  const email = body?.email;
  const label = body?.label ?? "Personal PayPal";

  if (provider !== "PAYPAL") {
    return NextResponse.json({ success: false, error: "Provider must be PAYPAL" }, { status: 400 });
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ success: false, error: "Valid email required" }, { status: 400 });
  }

  await prisma.$transaction(async (tx: any) => {
    await tx.payoutAccount.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    await tx.payoutAccount.upsert({
      where: {
        userId_provider_externalId: {
          userId,
          provider: "PAYPAL" as any,
          externalId: email,
        },
      },
      create: {
        userId,
        provider: "PAYPAL" as any,
        externalId: email,
        label,
        isDefault: true,
      },
      update: { label, isDefault: true },
    });
  });

  return NextResponse.json({ success: true });
}
