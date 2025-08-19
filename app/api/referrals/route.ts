// app/api/referrals/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth"; // ✅ types from "next-auth"
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    const email = session?.user?.email ?? null;
    if (!email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Check caller is ADMIN
    const me = await prisma.user.findUnique({
      where: { email },
      select: { id: true, role: true },
    });
    if (!me) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    if (me.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Infer referrals from users having referredById set
    const referrals = await prisma.user.findMany({
      where: { referredById: { not: null } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        referredById: true,
      },
    });

    return NextResponse.json({ success: true, referrals });
  } catch (err) {
    console.error("Referrals GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
