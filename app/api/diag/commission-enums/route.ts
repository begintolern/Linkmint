// app/api/diag/commission-enums/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Row = { typname: string; enumlabel: string };

export async function GET() {
  // Require a logged-in session (your admin account is fine)
  const rawSession = await getServerSession(authOptions);
  const session = rawSession as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  // Query Postgres enum values potentially used for commissions
  // We try multiple likely type names to be safe.
  const candidates = [
    "CommissionType",
    "commissiontype",
    "commission_type",
    "Commission_Status",
    "commission_status",
    "CommissionStatus",
  ];

  try {
    const rows = (await prisma.$queryRawUnsafe<Row[]>(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = ANY(ARRAY[${candidates.map((c) => `'${c}'`).join(",")}])
      ORDER BY t.typname, e.enumsortorder;
    `)) as Row[];

    // Also try a fuzzy search in case the type name is different
    const fuzzy = (await prisma.$queryRawUnsafe<Row[]>(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname ILIKE '%commission%' OR t.typname ILIKE '%status%'
      ORDER BY t.typname, e.enumsortorder;
    `)) as Row[];

    return NextResponse.json({
      ok: true,
      sessionEmail: session.user.email,
      enums: rows,
      fuzzy,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Enum introspection failed" },
      { status: 500 }
    );
  }
}
