export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    // DB ping
    await prisma.$queryRaw`SELECT 1`;

    // check key envs
    const must = ["DATABASE_URL", "NEXTAUTH_URL", "NEXTAUTH_SECRET"];
    const missing = must.filter((k) => !process.env[k]);

    return NextResponse.json({
      ok: true,
      db: "ok",
      envMissing: missing,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "health failed" }, { status: 500 });
  }
}
