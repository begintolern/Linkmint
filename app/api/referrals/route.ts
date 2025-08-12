import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const email = session?.user?.email;
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the current user
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Latest referral group (if any)
    const group = await prisma.referralGroup.findFirst({
      where: { referrerId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, expiresAt: true, startedAt: true, createdAt: true },
    });

    // Accurate total referrals (users who signed up with this user as referrer)
    const totalReferrals = await prisma.user.count({
      where: { referredById: user.id },
    });

    const base =
      process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
      "https://linkmint.co";
    const referralLink = `${base}/signup?ref=${user.id}`;

    const now = new Date();
    const isActive = !!(group && group.expiresAt && group.expiresAt > now);

    return NextResponse.json({
      referralLink,
      totalReferrals,
      isActive,
      expiresAt: group?.expiresAt ?? null,
    });
  } catch (err) {
    console.error("referrals GET error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
