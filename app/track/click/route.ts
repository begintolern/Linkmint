// app/track/click/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/** Try to coerce a string into the Prisma enum for ClickSource (if present). */
function coerceClickSource(raw: any): any {
  const src = String(raw ?? "").trim();
  const enums = (Prisma as any).$Enums;
  if (enums?.ClickSource) {
    const values = Object.values(enums.ClickSource);
    if (values.includes(src)) return src;
    if (values.includes("UNKNOWN")) return "UNKNOWN";
    return values[0] ?? (src || "UNKNOWN");
  }
  // If your model doesn’t use an enum, just pass through a string.
  return src || "UNKNOWN";
}

/** Extract basic client info */
function getClientInfo(req: Request) {
  const h = new Headers(req.headers);
  const ua = h.get("user-agent") || null;
  const forwardedFor = h.get("x-forwarded-for");
  const cfIp = h.get("cf-connecting-ip");
  const realIp = h.get("x-real-ip");
  const ip =
    (forwardedFor?.split(",")[0].trim() ||
      cfIp ||
      realIp ||
      h.get("x-client-ip") ||
      h.get("x-appengine-user-ip")) ?? null;

  return { ip, ua };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const merchantId = body?.merchantId != null ? String(body.merchantId) : null;
    const userId = body?.userId ? String(body.userId) : null;
    const source = coerceClickSource(body?.source);
    const linkId = body?.linkId ? String(body.linkId) : null;
    const url = body?.url ? String(body.url) : null;

    if (!merchantId) {
      return NextResponse.json(
        { ok: false, error: "merchantId is required" },
        { status: 400 }
      );
    }

    const { ip, ua } = getClientInfo(req);
    const now = new Date();

    // Minimal payload that satisfies schemas requiring explicit id/timestamps.
    const data: any = {
      id: crypto.randomUUID(), // ✅ required @id if no default
      createdAt: now,          // safe if your model lacks @default(now())
      updatedAt: now,          // safe if your model lacks @updatedAt

      userId,                  // nullable if schema allows
      merchantId,              // string
      source,                  // enum-safe
      ip,
      userAgent: ua,
    };

    if (linkId) data.linkId = linkId;
    if (url) data.url = url;

    const created = await prisma.clickEvent.create({ data });

    return NextResponse.json({
      ok: true,
      id: created.id,
      ts: created?.createdAt ?? now,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? "unknown_error" },
      { status: 400 }
    );
  }
}

export async function GET(req: Request) {
  // Optional simple ping: /track/click?ping=1
  const { searchParams } = new URL(req.url);
  if (searchParams.get("ping")) return NextResponse.json({ ok: true, pong: true });
  return NextResponse.json({ ok: true });
}
