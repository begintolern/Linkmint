// app/api/admin/payout-requests/deny/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function assertAdmin(req: Request) {
  const key = req.headers.get("x-admin-key") || "";
  return !!process.env.ADMIN_API_KEY && key === process.env.ADMIN_API_KEY;
}

export async function POST(req: Request) {
  try {
    if (!assertAdmin(req)) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({} as any));
    const id = String(body?.id || "");
    const note = typeof body?.note === "string" ? body.note.slice(0, 250) : "Denied";

    if (!id) {
      return NextResponse.json({ ok: false, error: "MISSING_ID" }, { status: 400 });
    }

    const updated = await prisma.payoutRequest.update({
      where: { id },
      data: {
        status: "FAILED",
        processedAt: new Date(),
        processorNote: note,
      },
      select: {
        id: true, userId: true, amountPhp: true, method: true, provider: true,
        status: true, requestedAt: true, processedAt: true, processorNote: true,
      },
    });

    return NextResponse.json({ ok: true, request: updated });
  } catch (e: any) {
    console.error("POST /admin/payout-requests/deny error:", e);
    return NextResponse.json({ ok: false, error: "SERVER_ERROR", detail: e?.message }, { status: 500 });
  }
}
