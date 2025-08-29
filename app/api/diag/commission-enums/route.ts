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
  const rawSession = await getServerSession(authOptions);
  const session = rawSession as Session | null;
  if (!session?.user?.email) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Targeted candidates first
    const candidates = [
      "CommissionType",
      "PayoutStatus",
      "PayoutMethod",
      "PaymentMethod",
      "payout_method",
      "payment_method",
      "payoutstatus",
      "payout_status",
      "commissiontype",
      "commission_type",
    ];

    const rows = (await prisma.$queryRawUnsafe<Row[]>(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname = ANY(ARRAY[${candidates.map((c) => `'${c}'`).join(",")}])
      ORDER BY t.typname, e.enumsortorder;
    `)) as Row[];

    // Fuzzy catch-all for anything payout/payment/method
    const fuzzy = (await prisma.$queryRawUnsafe<Row[]>(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname ILIKE '%payout%' 
         OR t.typname ILIKE '%payment%' 
         OR t.typname ILIKE '%method%'
         OR t.typname ILIKE '%commission%'
         OR t.typname ILIKE '%status%'
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
