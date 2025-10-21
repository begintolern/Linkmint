import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function maskDbUrl(raw?: string) {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    if (u.password) u.password = "***";
    return u.toString();
  } catch {
    return "(invalid URL format)";
  }
}

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  const masked = maskDbUrl(dbUrl);

  try {
    // Small, read-only probe
    const r = await prisma.$queryRawUnsafe("select 1 as ok");
    return NextResponse.json({ ok: true, envUrl: masked, probe: r });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        envUrl: masked,
        error: e?.message || String(e),
        name: e?.name,
        code: e?.code,
      },
      { status: 500 }
    );
  }
}
