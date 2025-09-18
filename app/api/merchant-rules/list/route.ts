// app/api/merchant-rules/list/route.ts
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { MerchantRule as DbMerchantRule } from '@prisma/client';

function serializeMerchant(m: DbMerchantRule) {
  return {
    ...m,
    // Prisma.Decimal -> number (or string if you prefer)
    commissionRate: m.commissionRate ? Number(m.commissionRate) : null,
    // Dates -> ISO strings for safe JSON
    lastImportedAt: m.lastImportedAt ? m.lastImportedAt.toISOString() : null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    // Json fields can pass through as-is (already JSON-safe)
    allowedSources: m.allowedSources ?? null,
    disallowed: m.disallowed ?? null,
  };
}

export async function GET() {
  try {
    const rows = await prisma.merchantRule.findMany({
      orderBy: { merchantName: 'asc' },
    });

    const merchants = rows.map(serializeMerchant);
    return NextResponse.json({ ok: true, merchants });
  } catch (err) {
    console.error('merchant-rules/list GET failed:', err);
    return NextResponse.json({ ok: false, error: 'DB_ERROR' }, { status: 500 });
  }
}
