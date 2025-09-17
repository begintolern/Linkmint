// app/api/merchant-rules/list/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic"; // no static cache for this route

// Prisma singleton to avoid hot-reload issues in dev
const prisma = (global as any).prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") (global as any).prisma = prisma;

type Raw = any;
type Out = {
  id: string;
  name: string | null;
  domain: string | null;
  network: string | null;
  commission: string | null;
  status: string | boolean | null;
  updatedAt: string | null;
};

function normalize(row: Raw): Out {
  return {
    id: row.id ?? row.uuid ?? "",
    name: row.name ?? row.label ?? null,
    domain: row.domain ?? row.host ?? null,
    network: row.network ?? row.program ?? "CJ",
    commission: row.commission ?? row.defaultCommission ?? null,
    status:
      typeof row.status !== "undefined"
        ? row.status
        : typeof row.isActive !== "undefined"
        ? row.isActive
        : null,
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : null,
  };
}

export async function GET() {
  try {
    // If your Prisma model is "MerchantRule", this works.
    // If it's "Merchant" instead, change to prisma.merchant.findMany(...)
    const rows: Raw[] = await (prisma as any).merchantRule.findMany({
      orderBy: { name: "asc" },
    });

    const merchants = (rows ?? []).map(normalize);
    return NextResponse.json({ ok: true, merchants });
  } catch (e) {
    console.error("[/api/merchant-rules/list] ERROR:", e);
    return NextResponse.json({ ok: false, merchants: [] }, { status: 500 });
  }
}
