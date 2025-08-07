// app/api/user/commissions/summary/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token || !token.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: token.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const commissions = await prisma.payout.findMany({
      where: { userId: user.id },
    });

    let pending = 0, approved = 0, paid = 0;

    for (const c of commissions) {
      if (c.status === "pending") pending += c.amount;
      else if (c.status === "approved") approved += c.amount;
      else if (c.status === "paid") paid += c.amount;
    }

    return NextResponse.json({ pending, approved, paid });
  } catch (error) {
    console.error("Error fetching commission summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
