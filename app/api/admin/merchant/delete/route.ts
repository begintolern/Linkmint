export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/admin/merchant/delete
// Headers: x-task-key=<TASK_KEY>
// Body: { "id": "<merchantId>" }

export async function POST(req: Request) {
  const key = req.headers.get("x-task-key") || "";
  if (!process.env.TASK_KEY || key !== process.env.TASK_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json().catch(() => ({}));
  if (!id || typeof id !== "string") {
    return NextResponse.json({ ok: false, error: "Missing id" }, { status: 400 });
  }

  try {
    const deleted = await prisma.merchantRule.delete({ where: { id } });
    return NextResponse.json({
      ok: true,
      deleted: {
        id: deleted.id,
        merchantName: deleted.merchantName,
        market: (deleted as any).market,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
