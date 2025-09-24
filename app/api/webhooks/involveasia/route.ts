// app/api/webhooks/involveasia/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

// If Involve Asia gives you a secret, put it here
const SHARED_SECRET = process.env.INVOLVEASIA_WEBHOOK_SECRET || "";

/**
 * POST /api/webhooks/involveasia
 * - Accepts JSON payloads
 * - Optional HMAC verification (X-Signature header), if secret is configured
 * - Idempotent via eventId / hash
 * - Logs to EventLog (type = WEBHOOK_INCOMING) with detail JSON
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "INVALID_JSON", message: "Body must be valid JSON" },
      { status: 400 }
    );
  }

  // Raw string for signature verification + stable hashing
  const raw = JSON.stringify(body);

  // 1) Optional signature verify
  if (SHARED_SECRET) {
    const sig = req.headers.get("x-signature") || req.headers.get("x-ia-signature");
    if (!sig) {
      return NextResponse.json(
        { ok: false, error: "UNSIGNED", message: "Missing signature header" },
        { status: 401 }
      );
    }
    const expected = crypto
      .createHmac("sha256", SHARED_SECRET)
      .update(raw, "utf8")
      .digest("hex");

    if (!timingSafeEqualLower(sig, expected)) {
      return NextResponse.json(
        { ok: false, error: "BAD_SIGNATURE", message: "Signature verification failed" },
        { status: 401 }
      );
    }
  }

  // 2) Idempotency key: prefer a network-provided id, else hash of body
  const eventId =
    (body?.event_id as string) ||
    (body?.transaction_id as string) ||
    crypto.createHash("sha256").update(raw).digest("hex");

  // 3) Upsert into a small idempotency table (create if you don't have it)
  // If you don't have a table yet, we still log the EventLog — duplicate-safe via unique index later.
  try {
    // Try a lightweight uniqueness guard by writing a log row with unique key in message
    // (Better: create a dedicated table with unique(eventId))
    const exists = await prisma.eventLog.findFirst({
      where: { type: "WEBHOOK_INCOMING", message: eventId },
      select: { id: true },
    });
    if (exists) {
      return NextResponse.json({ ok: true, deduped: true });
    }
  } catch {
    // If the query fails, continue; logging below will still help us debug
  }

  // 4) Persist the raw webhook for auditing (detail = JSON string)
  try {
    await prisma.eventLog.create({
      data: {
        // not tied to a user at intake; we’ll reconcile later using subid
        type: "WEBHOOK_INCOMING",
        message: eventId,
        detail: raw,
      },
    });
  } catch (e: any) {
    // If duplicates happen, we still return ok to avoid retries storm
    return NextResponse.json(
      { ok: true, stored: false, note: "Log write failed; likely duplicate", err: String(e) },
      { status: 200 }
    );
  }

  // 5) Minimal OK; reconciliation job will process logs → commissions later
  return NextResponse.json({ ok: true, stored: true });
}

// Constant-time compare for hex strings (case-insensitive)
function timingSafeEqualLower(a: string, b: string) {
  const an = a.trim().toLowerCase();
  const bn = b.trim().toLowerCase();
  const bufA = Buffer.from(an, "utf8");
  const bufB = Buffer.from(bn, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
