// app/api/track/conversion/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/** Enum coercion helper (works whether enums exist or not) */
function coerceEnum(raw: any, enumObj?: Record<string, string>, fallback?: string) {
  const v = String(raw ?? "").trim();
  if (!enumObj) return v || fallback || "UNKNOWN";
  const values = Object.values(enumObj);
  if (values.includes(v)) return v;
  if (fallback && values.includes(fallback)) return fallback;
  return values[0] ?? v || fallback || "UNKNOWN";
}

/** Try to read Click/Conversion enums from Prisma.$Enums (newer Prisma) */
const E = (Prisma as any).$Enums || {};
const ClickSourceEnum = E.ClickSource as Record<string, string> | undefined;
const ConversionStatusEnum = E.ConversionStatus as Record<string, string> | undefined;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const userId = body?.userId ? String(body.userId) : null;
    const merchantId = body?.merchantId ? String(body.merchantId) : null;
    const orderId = body?.orderId ? String(body.orderId) : null;

    // Parse amount (accepts number or string), store as number (dollars)
    let amount: number | null = null;
    if (body?.amount !== undefined && body?.amount !== null && body?.amount !== "") {
      const num = Number(body.amount);
      if (Number.isFinite(num)) amount = num;
    }

    // Coerce enums (fallbacks if schema uses enums)
    const source = coerceEnum(body?.source, ClickSourceEnum, "UNKNOWN");
    const status = coerceEnum(body?.status, ConversionStatusEnum, "PENDING");

    if (!merchantId) {
      return NextResponse.json(
        { ok: false, error: "merchantId is required" },
        { status: 400 }
      );
    }

    // Provide required fields commonly needed by Prisma schemas
    const now = new Date();

    // Build payload — cast to any to avoid TS friction if model differs slightly
    const data: any = {
      id: crypto.randomUUID(), // ✅ fix for "id is required" on create
      createdAt: now,          // safe if no @default(now())
      updatedAt: now,          // safe if no @updatedAt

      userId,                  // nullable ok if column allows
      merchantId,              // string
      orderId,                 // nullable
      amount,                  // number|null (dollars)
      source,                  // enum/string coerced
      status,                  // enum/string coerced
    };

    // Optional association fields if your schema has them:
    if (body?.linkId) data.linkId = String(body.linkId);
    if (body?.url) data.url = String(body.url);

    const conv = await prisma.conversion.create({ data });

    return NextResponse.json({
      ok: true,
      id: conv.id,
      ts: conv?.createdAt ?? now,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}

/** Optional health check */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("ping")) return NextResponse.json({ ok: true, pong: true });
  return NextResponse.json({ ok: true });
}
