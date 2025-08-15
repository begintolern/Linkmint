import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET() {
  try {
    // Show what the server sees at runtime (masking the password).
    const raw = process.env.DATABASE_URL || '';
    const masked = raw.replace(/:(.*?)@/, ':****@');
    
    // Try a quick query
    const prisma = new PrismaClient({
      datasources: { db: { url: raw || undefined } },
    });

    // SELECT 1 is universal, but Prisma prefers a simple query via $queryRawUnsafe
    const ok = await prisma.$queryRawUnsafe('SELECT 1');
    await prisma.$disconnect();

    return NextResponse.json({
      envHasDatabaseUrl: Boolean(raw),
      databaseUrl: masked,
      queryOk: true,
      result: ok,
    });
  } catch (err: any) {
    return NextResponse.json({
      envHasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      error: String(err?.message || err),
      stack: err?.stack,
    }, { status: 500 });
  }
}
