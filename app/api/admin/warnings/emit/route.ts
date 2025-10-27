// app/api/admin/warnings/emit/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomUUID } from "crypto";

const ADMIN_KEY = process.env.ADMIN_API_KEY || "";

export async function POST(req: Request) {
  try {
    const adminKey = req.headers.get("x-admin-key") || "";
    if (!ADMIN_KEY || adminKey !== ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });
    }

    const url = new URL(req.url);
    const isJson = (req.headers.get("content-type") || "").includes("application/json");
    const payload = isJson ? await req.json().catch(() => ({})) : {};

    const userIdRaw =
      payload.userId ?? url.searchParams.get("userId") ?? "";
    const type =
      String(payload.type ?? url.searchParams.get("type") ?? "TEST_WARNING");
    const message =
      String(payload.message ?? url.searchParams.get("message") ?? "Emit test");

    const evidenceRaw = payload.evidence ?? url.searchParams.get("evidence");
    let meta: any = undefined;
    try {
      meta = typeof evidenceRaw === "string" ? JSON.parse(evidenceRaw) : evidenceRaw;
    } catch {
      meta = String(evidenceRaw ?? "");
    }

    // IMPORTANT:
    // - Many Prisma models require an explicit id if @default(cuid()) is not set.
    // - Use undefined (not null) for optional fields unless schema allows nulls.
    const row = await prisma.complianceEvent.create({
      data: {
        id: randomUUID(),
        type,
        message,
        severity: 1,
        userId: userIdRaw ? String(userIdRaw) : undefined,
        merchantId: undefined,
        meta: meta as any,
      },
      select: {
        id: true,
        type: true,
        message: true,
        userId: true,
        createdAt: true,
        meta: true,
      },
    });

    return NextResponse.json({ ok: true, created: row });
  } catch (e: any) {
    console.error("[/api/admin/warnings/emit] error:", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
