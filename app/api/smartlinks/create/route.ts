// app/api/smartlinks/create/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Body = {
  merchantId?: string;       // accepted but not stored
  destinationUrl?: string;
  source?: string;           // accepted but not stored
};

const MERCHANT_NAME_BY_ID: Record<string, string> = {
  cmfvvoxsj0000oij8u4oadeo5: "Lazada PH",
  cmfu940920003oikshotzltnp: "Shopee",
};

function randomId(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

/**
 * Picks the best base URL for constructing short links.
 * - Honors NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_BASE_URL
 * - Forces HTTP on localhost to avoid SSL errors
 * - Defaults to req.host if no env var is set
 */
function getPreferredBase(req: NextRequest) {
  const envBase =
    (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || "").trim();

  if (envBase && /^https?:\/\//i.test(envBase)) {
    try {
      const u = new URL(envBase);
      const isLocal =
        u.hostname === "localhost" ||
        u.hostname === "127.0.0.1" ||
        u.hostname.endsWith(".local");
      const proto = isLocal ? "http" : u.protocol.replace(":", "");
      return `${proto}://${u.host}`.replace(/\/+$/, "");
    } catch {
      // fallback below
    }
  }

  const u = new URL(req.url);
  const host = u.host.toLowerCase();
  const isLocal =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.endsWith(".local");

  const proto = isLocal ? "http" : "https";
  return `${proto}://${host}`;
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "POST only" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    // --- Require authentication
    const session = (await getServerSession(authOptions)) as Session | null;
    const userId = (session as any)?.user?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // --- Parse request body
    const body = (await req.json()) as Body;
    const destinationUrl = body.destinationUrl?.trim();
    const merchantId = body.merchantId?.trim();

    if (!destinationUrl) {
      return NextResponse.json(
        { ok: false, message: "destinationUrl is required" },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { ok: false, message: "destinationUrl must be a valid URL (https://...)" },
        { status: 400 }
      );
    }

    const merchantName = MERCHANT_NAME_BY_ID[merchantId ?? ""] ?? "Unknown";
    const merchantDomain = parsed.hostname || null;

    const id = randomId(6);
    const base = getPreferredBase(req);
    const shortUrl = `${base}/r/${id}`;

    // ✅ Store fields that exist in the Prisma model only
    await prisma.smartLink.create({
      data: {
        id,
        userId,
        merchantRuleId: null,
        merchantName,
        merchantDomain,
        originalUrl: destinationUrl,
        shortUrl,
        label: null,
        destinationsJson: { default: destinationUrl },
      },
    });

    return NextResponse.json({ ok: true, id, shortUrl, merchant: merchantName });
  } catch (err) {
    console.error("smartlinks/create error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
