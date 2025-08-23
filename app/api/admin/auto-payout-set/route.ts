// app/api/admin/auto-payout-set/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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

export async function POST(req: Request): Promise<NextResponse<Resp>> {
  // Double-check admin (middleware also handles this)
  const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  if (((token as any).role ?? "USER") !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as { value?: unknown };
    const desired = toBool(body?.value);
    const key = "autoPayoutsOn";

    const updated = await prisma.systemSetting.upsert({
      where: { key },
      create: { key, value: desired as any }, // supports boolean or string columns
      update: { value: desired as any },
    });

    return NextResponse.json({ success: true, value: toBool(updated.value) });
  } catch (err) {
    console.error("auto-payout-set POST error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
