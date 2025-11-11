export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

// Accept any of:
// 1) NextAuth session with role ADMIN
// 2) Cookie admin_key == ADMIN_API_KEY
// 3) Header x-admin-key == ADMIN_API_KEY
async function isAdmin(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    if (session?.user?.role?.toUpperCase?.() === "ADMIN") return true;

    const jar = cookies();
    const cookieKey = jar.get("admin_key")?.value || "";
    const headerKey = req.headers.get("x-admin-key") || "";
    const expected = process.env.ADMIN_API_KEY || "";
    if (expected && (cookieKey === expected || headerKey === expected)) return true;

    return false;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin(req))) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({} as any));
    const id = (body?.id ?? "").toString().trim();
    const noteRaw = typeof body?.note === "string" ? body.note : "Marked paid via admin UI";
    const note = noteRaw.slice(0, 250);

    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    // IMPORTANT: only write fields that exist on PayoutRequest.
    // Do NOT write transactionId or other fields if not in schema.
    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "PAID",           // Prisma enum value
        processedAt: new Date(),
        processorNote: note,
      },
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
    console.error("POST /admin/payout-requests/mark-paid error:", e?.message || e);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR", detail: e?.message || "unknown" },
      { status: 500 }
    );
  }
}
