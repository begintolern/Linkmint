// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

export async function GET(req: NextRequest) {
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
    const email = searchParams.get("email")?.trim() || "";

    const rows = await prisma.user.findMany({
      where: email ? { email: { contains: email, mode: "insensitive" } } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        trustScore: true,
        referralCode: true,
        referralBadge: true,
        emailVerifiedAt: true,
      },
    });

    type Row = typeof rows[number];

    const out = rows.map((u: Row) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt.toISOString(),
      trustScore: u.trustScore,
      referralCode: u.referralCode,
      referralBadge: u.referralBadge,
      emailVerified: Boolean(u.emailVerifiedAt),
    }));

    return NextResponse.json({ success: true, rows: out });
  } catch (err) {
    console.error("admin/users error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
