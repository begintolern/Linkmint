// app/api/admin/waitlist/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // We use raw SQL so we can safely read the `status` column
    // even though Prisma's Waitlist model may not include it.
    const rows = (await prisma.$queryRawUnsafe(`
      SELECT "id", "email", "source", "status", "createdAt"
      FROM "Waitlist"
      ORDER BY "createdAt" ASC
      LIMIT 200
    `)) as {
      id: string;
      email: string;
      source: string | null;
      status: string | null;
      createdAt: Date;
    }[];

    const items = rows.map((r) => ({
      id: r.id,
      email: r.email,
      source: r.source,
      status: r.status ?? "waiting",
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({
      ok: true,
      items,
      count: items.length,
    });
  } catch (err: any) {
    console.error("[ADMIN WAITLIST][GET] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
