import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Simple round‑trip to the DB
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    return NextResponse.json({
      ok: true,
      db: rows?.[0]?.ok === 1,
      ts: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect().catch(() => {});
  }
}
