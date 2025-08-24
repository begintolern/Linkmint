export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = (await getServerSession(authOptions as any)) as any;
    if (!session?.user?.email) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const me = await prisma.user.findUnique({
      where: { email: session.user.email as string },
      select: { id: true, role: true },
    });
    if (!me || (me.role ?? "").toUpperCase() !== "ADMIN") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
    }

    const row = await prisma.payout.findUnique({
      where: { id },
      select: {
        id: true,
        createdAt: true,
        statusEnum: true,
        provider: true,
        netCents: true,
        amount: true,
        receiverEmail: true,
        transactionId: true,
        userId: true,
      },
    });

    if (!row) return NextResponse.json({ ok: true, row: null });
    return NextResponse.json({ ok: true, row });
  } catch (e) {
    console.error("GET /api/admin/payouts/get error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
