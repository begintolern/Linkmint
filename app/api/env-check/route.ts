import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const keys = Object.keys(process.env).filter(k => k.includes("DATABASE"));
  return NextResponse.json({
    keys,
    has_DATABASE_URL: Boolean(process.env.DATABASE_URL),
    len: process.env.DATABASE_URL?.length ?? 0,
  });
}
