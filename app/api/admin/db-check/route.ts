// app/api/admin/db-check/route.ts
export const runtime = "nodejs"; // ensure Prisma DB access

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function isAdmin(req: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY || "";
  return (
    req.cookies.get("admin_key")?.value === key ||
    req.headers.get("x-admin-key") === key
  );
}

function maskDbUrl(url?: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // mask user/pass
    const host = u.hostname;
    const port = u.port;
    const db = (u.pathname || "").replace(/^\//, "");
    return {
      scheme: u.protocol.replace(":", ""),
      host,
      port,
      db,
      hasSSL: u.search.includes("sslmode=") || u.search.includes("sslmode=require"),
    };
  } catch {
    return { invalid: true };
  }
}

/**
 * GET /api/admin/db-check
 * Confirms DATABASE_URL visibility and a basic DB round-trip.
 */
export async function GET(req: NextRequest) {
  if (!isAdmin(req)) {
    return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const masked = maskDbUrl(process.env.DATABASE_URL);

  try {
    // Simple connectivity probe
    // Using a lightweight raw query that most SQL DBs accept
    // For Postgres this will work: SELECT 1;
    const rows: any = await prisma.$queryRawUnsafe(`SELECT 1 AS ok`);
    return NextResponse.json(
      {
        ok: true,
        env: { DATABASE_URL: masked },
        probe: rows,
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        env: { DATABASE_URL: masked },
        error: String(err?.message || err),
      },
      { status: 200 }
    );
  }
}
