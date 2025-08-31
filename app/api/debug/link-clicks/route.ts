// app/api/debug/link-clicks/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/debug/link-clicks
 * Returns the 20 most recent LINK_CLICK EventLog rows so we can confirm logging.
 */
export async function GET() {
  try {
    const rows = await prisma.eventLog.findMany({
      where: { type: "LINK_CLICK" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, type: true, detail: true, message: true },
    });
    return NextResponse.json({ ok: true, rows });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 });
  }
}
