// app/api/track/click/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

/**
 * Utility: best-effort enum coercion.
 * If your ClickEvent.source is an enum (e.g., Prisma.$Enums.ClickSource),
 * we coerce incoming `source` to a valid member; otherwise we return the raw string.
 */
function coerceClickSource(raw: any): any {
  const src = String(raw ?? "").trim();
  // Try Prisma $Enums (modern Prisma)
  const enums = (Prisma as any).$Enums;
  if (enums?.ClickSource) {
    const values = Object.values(enums.ClickSource);
    if (values.includes(src)) return src as (typeof enums.ClickSource)[keyof typeof enums.ClickSource];
    // Fallback to a safe value if available
    if (values.includes("UNKNOWN")) return "UNKNOWN";
    return values[0]; // first enum value as last resort
  }
  // Older Prisma: no enum export — just pass the string through
  return src || "UNKNOWN";
}

/**
 * Extract IP / UA in a platform-agnostic way.
 */
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
      // Next.js edge runtimes sometimes put it here:
      (h.get("x-client-ip") || h.get("x-appengine-user-ip"))) ?? null;

  return { ip, ua };
}

/**
 * Accepts click beacons from the client.
 *
 * POST body (JSON):
 *   {
 *     "merchantId": string,
 *     "source": string,             // will be coerced to enum if needed
 *     "userId": string | null,      // optional; can be omitted
 *     // optional extras:
 *     "linkId": string,
 *     "url": string
 *   }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ip, ua } = getClientInfo(req);

    // Coerce and sanitize inputs
    const merchantId = body?.merchantId != null ? String(body.merchantId) : null;
    const resolvedUserId = body?.userId ? String(body.userId) : null;
    const sourceEnum = coerceClickSource(body?.source);
    const linkId = body?.linkId ? String(body.linkId) : null;
    const url = body?.url ? String(body.url) : null;

    if (!merchantId) {
      return NextResponse.json(
        { ok: false, error: "merchantId is required" },
        { status: 400 }
      );
    }

    // Many Prisma schemas require explicit id/timestamps if no defaults are present.
    const now = new Date();

    // Build the minimal create payload your model will accept.
    // We include common fields; if your model doesn't have some of them, Prisma will ignore at runtime,
    // but TypeScript can complain, so we cast `data` to `any` to avoid compile-time friction.
    const data: any = {
      id: crypto.randomUUID(),  // ✅ fixes "id required" error when schema lacks @default(cuid/uuid)
      createdAt: now,           // safe if your schema lacks @default(now())
      updatedAt: now,           // safe if your schema lacks @updatedAt

      userId: resolvedUserId,   // nullable is okay if your schema allows it
      merchantId,               // String
      source: sourceEnum,       // enum or string, coerced above
      ip,
      userAgent: ua,
    };

    // Optional props — only include if you actually have these columns
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

/**
 * Lightweight GET to verify the route is live (optional).
 * Example: /api/track/click?ping=1
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("ping")) {
    return NextResponse.json({ ok: true, pong: true });
  }
  return NextResponse.json({ ok: true });
}
