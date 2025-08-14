// app/api/health/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', database: 'unavailable', error: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
