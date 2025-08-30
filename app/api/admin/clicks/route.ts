// app/api/admin/clicks/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session as any)?.user?.role ?? "USER";
    if (role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const rows = await prisma.eventLog.findMany({
      where: { type: "CLICK" },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        createdAt: true,
        type: true,
        detail: true,
        message: true,
        user: { select: { id: true, email: true } },
      },
    });

    return NextResponse.json({ success: true, rows });
  } catch (e: any) {
    console.error("[admin/clicks] error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
