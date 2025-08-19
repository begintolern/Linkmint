// app/api/commissions/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next"; // runtime
import type { Session } from "next-auth";          // types
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;

    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Resolve user id
    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!me) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Fetch commissions (adjust to your schema as needed)
    const commissions = await prisma.payout.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true, // e.g., "pending" | "approved" | "paid"
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, commissions });
  } catch (err) {
    console.error("Commissions GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
