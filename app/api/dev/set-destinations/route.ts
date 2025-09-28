// app/api/dev/set-destinations/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = String(body?.code || "").trim();
    const destinations = body?.destinations;

    if (!code) {
      return NextResponse.json({ ok: false, error: "Missing shortUrl code" }, { status: 400 });
    }
    if (!destinations || typeof destinations !== "object" || Array.isArray(destinations)) {
      return NextResponse.json({ ok: false, error: "Missing destinations map" }, { status: 400 });
    }

    const link = await prisma.smartLink.findFirst({
      where: { shortUrl: code },
      select: { id: true, shortUrl: true },
    });
    if (!link) return NextResponse.json({ ok: false, error: "SmartLink not found" }, { status: 404 });

    // Normalize & validate map (UPPERCASE keys, valid URLs)
    const norm: Record<string, string> = {};
    for (const [k, v] of Object.entries(destinations)) {
      if (typeof k !== "string" || typeof v !== "string") continue;
      const key = k.toUpperCase();
      if (!isValidUrl(v)) continue;
      norm[key] = v;
    }
    if (!Object.keys(norm).length) {
      return NextResponse.json({ ok: false, error: "No valid destinations provided" }, { status: 400 });
    }

    const jsonText = JSON.stringify(norm);

    // Ensure column exists (jsonb) then write it — with proper cast
    await prisma.$executeRawUnsafe('ALTER TABLE "SmartLink" ADD COLUMN IF NOT EXISTS "destinationsJson" JSONB;');
    await prisma.$executeRawUnsafe(
      'UPDATE "SmartLink" SET "destinationsJson" = CAST($1 AS JSONB) WHERE id = $2;',
      jsonText,
      link.id
    );

    // Read back for confirmation
    const rows = await prisma.$queryRawUnsafe<Array<{ shortUrl: string; destinationsJson: unknown }>>(
      'SELECT "shortUrl","destinationsJson" FROM "SmartLink" WHERE id = $1;',
      link.id
    );
    const current = rows?.[0]?.destinationsJson ?? norm;

    return NextResponse.json({ ok: true, shortUrl: link.shortUrl, destinations: current });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}
