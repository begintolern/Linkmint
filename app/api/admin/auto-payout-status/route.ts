// app/api/admin/auto-payout-status/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getToken } from "next-auth/jwt";

function toBool(val: unknown): boolean {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val.trim().toLowerCase() === "true";
  if (typeof val === "number") return val !== 0;
  return false;
}

export async function GET(req: Request) {
  // Admin auth (mirror middleware logic, but return JSON)
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const role = (token as any)?.role ?? "USER";
  if (role !== "ADMIN") return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });

  try {
    const key = "autoPayoutsOn";
    const found = await prisma.systemSetting.findUnique({ where: { key } });
    return NextResponse.json({ success: true, value: toBool(found?.value) });
  } catch (err) {
    console.error("auto-payout-status GET error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
