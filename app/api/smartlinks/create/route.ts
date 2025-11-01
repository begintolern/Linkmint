// app/api/smartlinks/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Body = {
  merchantId?: string;        // Lazada/Shopee ids
  destinationUrl?: string;    // product URL
  source?: string;            // "dashboard"
};

const MERCHANT_NAME_BY_ID: Record<string, { name: string; domain?: string }> = {
  cmfvvoxsj0000oij8u4oadeo5: { name: "Lazada PH", domain: "lazada.com.ph" },
  cmfu940920003oikshotzltnp: { name: "Shopee",    domain: "shopee.ph" },
};

function randomId(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function normalizeBase(base?: string | null) {
  if (!base) return "http://localhost:3000/";
  return base.endsWith("/") ? base : base + "/";
}

// Safe extractor that works even if next-auth types aren’t augmented
function getUserId(session: Session | null): string | null {
  const anyUser = (session as any)?.user ?? null;
  // Prefer explicit id; fall back to email if you want (or return null to force auth)
  return (anyUser?.id as string | undefined) ?? null;
}

export async function POST(req: NextRequest) {
  try {
    // Require auth
    const session = (await getServerSession(authOptions)) as Session | null;
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const merchantId = body.merchantId?.trim();
    const destinationUrl = body.destinationUrl?.trim();
    const source = body.source?.trim();

    if (!merchantId || !destinationUrl || !source) {
      return NextResponse.json(
        { ok: false, message: "Missing input. Required: merchantId, destinationUrl, source." },
        { status: 400 }
      );
    }

    // Validate destination URL
    let parsed: URL;
    try {
      parsed = new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { ok: false, message: "destinationUrl must be a valid URL (https://...)" },
        { status: 400 }
      );
    }

    const merchantMeta =
      MERCHANT_NAME_BY_ID[merchantId] ?? { name: "Unknown", domain: parsed.hostname };

    // Build short URL using our base
    const BASE = normalizeBase(process.env.NEXT_PUBLIC_APP_URL);
    const id = randomId(6);
    const shortUrl = `${BASE}r/${id}`;

    // JSON payload for Prisma (typed to avoid TS2322)
    const destinations: Prisma.InputJsonValue = {
      default: destinationUrl,
      source,
    };

    // Persist SmartLink (enables future /r/[id] DB resolve)
    await prisma.smartLink.create({
      data: {
        id,
        userId,
        merchantRuleId: null,
        merchantName: merchantMeta.name,
        merchantDomain: merchantMeta.domain ?? null,
        originalUrl: destinationUrl,
        shortUrl,
        label: null,
        destinationsJson: destinations,
      },
    });

    return NextResponse.json({
      ok: true,
      id,
      shortUrl,
      merchant: merchantMeta.name,
    });
  } catch (err) {
    console.error("smartlinks/create error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
