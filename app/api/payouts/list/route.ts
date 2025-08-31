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
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payouts = await prisma.payout.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      statusEnum: true,
      provider: true,
      netCents: true,
      amount: true,
      receiverEmail: true,
    },
  });

  return NextResponse.json({ success: true, payouts });
}
