// app/api/smartlinks/create/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

type Body = {
  merchantId?: string;        // accepted but not stored
  destinationUrl?: string;    // preferred key
  url?: string;               // legacy key (fallback)
  source?: string;            // accepted but not stored
};

/** Optional explicit ID→name mapping still honored if provided */
const MERCHANT_NAME_BY_ID: Record<string, string> = {
  cmfvvoxsj0000oij8u4oadeo5: "Lazada PH",
  cmfu940920003oikshotzltnp: "Shopee",
};

/** Domain keyword → merchant name */
const MERCHANT_BY_DOMAIN: Array<{ test: RegExp; name: string }> = [
  { test: /(^|\.)lazada\.(?:com\.ph|sg|co\.id|co\.th|com\.my|vn)$/i, name: "Lazada" },
  { test: /(^|\.)shopee\.(?:ph|sg|co\.id|co\.th|com\.my|vn)$/i, name: "Shopee" },
  { test: /(^|\.)amazon\.(?:com|sg|co\.jp|de|co\.uk|ca|com\.au)$/i, name: "Amazon" },
  { test: /(^|\.)involve\.asia$/i, name: "Involve Asia Offer" },
  { test: /(^|\.)tiktok\.com$/i, name: "TikTok Shop" },
  { test: /(^|\.)aliexpress\.com$/i, name: "AliExpress" },
];

/** Try to infer merchant from hostname */
function detectMerchantFromHost(hostname: string | null | undefined): string | null {
  if (!hostname) return null;
  const host = hostname.toLowerCase();
  for (const rule of MERCHANT_BY_DOMAIN) {
    if (rule.test.test(host)) return rule.name;
  }
  // light heuristics
  if (host.includes("lazada")) return "Lazada";
  if (host.includes("shopee")) return "Shopee";
  if (host.includes("amazon")) return "Amazon";
  return null;
}

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
      // fall through
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

    // --- Parse request body (accept both destinationUrl and url)
    const body = (await req.json()) as Body;
    const rawUrl = (body.destinationUrl ?? body.url ?? "").trim();
    const merchantId = body.merchantId?.trim();

    if (!rawUrl) {
      return NextResponse.json(
        { ok: false, message: "destinationUrl is required" },
        { status: 400 }
      );
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return NextResponse.json(
        { ok: false, message: "destinationUrl must be a valid URL (https://…)" },
        { status: 400 }
      );
    }

    // --- Determine merchant name
    const explicitName = MERCHANT_NAME_BY_ID[merchantId ?? ""];
    const detectedName = detectMerchantFromHost(parsed.hostname);
    const merchantName = explicitName || detectedName || "Unknown";
    const merchantDomain = parsed.hostname || null;

    // --- Create short link
    const id = randomId(6);
    const base = getPreferredBase(req);
    const shortUrl = `${base}/r/${id}`;

    // ✅ Store only columns that exist in Prisma
    await prisma.smartLink.create({
      data: {
        id,
        userId,
        merchantRuleId: null,
        merchantName,
        merchantDomain,
        originalUrl: rawUrl,
        shortUrl,
        label: null,
        destinationsJson: { default: rawUrl },
      },
    });

    return NextResponse.json({
      ok: true,
      id,
      shortUrl,
      merchant: merchantName,
      domain: merchantDomain,
    });
  } catch (err) {
    console.error("smartlinks/create error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
