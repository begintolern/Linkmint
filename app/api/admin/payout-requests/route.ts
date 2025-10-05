// app/api/admin/payout-requests/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Fetch all payout requests for admin view
export async function GET() {
  try {
    const rows = await prisma.payoutRequest.findMany({
      orderBy: { requestedAt: "desc" },
      include: {
        user: { select: { email: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, items: rows });
  } catch (err: any) {
    console.error("[payout-requests] Error fetching payout requests:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Failed to fetch payout requests",
        detail: String(err?.message ?? err),
      },
      { status: 500 }
    );
  }
}
