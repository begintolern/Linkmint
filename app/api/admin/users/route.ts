// app/api/admin/users/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { adminGuard } from "@/lib/utils/adminGuard";

export async function GET(req: NextRequest) {
  // Gate: only admins
  const gate = await adminGuard();
  if (!gate.ok) {
    return NextResponse.json({ success: false, error: gate.reason }, { status: gate.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? "100"), 500);
    const cursor = searchParams.get("cursor") || null;

    const rows = await prisma.user.findMany({
      take: limit,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerifiedAt: true,
        createdAt: true,
        role: true,
        trustScore: true,
      },
    });

    const nextCursor = rows.length === limit ? rows[rows.length - 1].id : null;

    return NextResponse.json({ success: true, rows, nextCursor });
  } catch (err) {
    console.error("Admin users GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
