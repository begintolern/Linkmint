import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV || "(unset)",
    hasAdminKey: !!(process.env.ADMIN_KEY ?? "").trim(),
    adminKeyLen: (process.env.ADMIN_KEY ?? "").trim().length,
  });
}
