export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

/** Accept any of:
 *  1) NextAuth session with role ADMIN
 *  2) Cookie admin_key == ADMIN_API_KEY
 *  3) Header x-admin-key == ADMIN_API_KEY  (optional, for tools)
 */
async function assertAdmin(req: Request) {
  try {
    // 1) NextAuth session
    const session = (await getServerSession(authOptions)) as any;
    if (session?.user?.role === "ADMIN") return true;

    // 2) Cookie admin_key
    const jar = cookies();
    const cookieKey = jar.get("admin_key")?.value || "";

    // 3) Header x-admin-key
    const headerKey = req.headers.get("x-admin-key") || "";

    const expected = process.env.ADMIN_API_KEY || "";
    if (expected && (cookieKey === expected || headerKey === expected)) return true;

    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await assertAdmin(req))) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || "");
    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: { status: "PROCESSING" as any },
      select: {
        id: true,
        userId: true,
        amountPhp: true,
        method: true,
        provider: true,
        status: true,
        requestedAt: true,
        processedAt: true,
        processorNote: true,
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (e: any) {
    console.error("POST /admin/payout-requests/mark-processing error:", e);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: e?.message },
      { status: 500 }
    );
  }
}
