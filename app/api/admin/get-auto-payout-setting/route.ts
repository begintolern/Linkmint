// app/api/admin/get-auto-payout-setting/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

type Ok = { success: true; value: boolean };
type Err = { success: false; error: string };
type Resp = Ok | Err;

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  if (typeof val === "number") return val !== 0;
  return false;
}

export async function GET(req: Request): Promise<NextResponse<Resp>> {
  // double-check admin (middleware should handle this, but be safe)
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (((token as any).role ?? "USER") !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const key = "autoPayoutsOn";
    const row = await prisma.systemSetting.findUnique({ where: { key } });
    return NextResponse.json({ success: true, value: toBool(row?.value) });
  } catch (err) {
    console.error("get-auto-payout-setting error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
