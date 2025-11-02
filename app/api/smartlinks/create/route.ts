// app/api/smartlinks/create/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

type Body = {
  merchantId?: string;
  destinationUrl?: string;
  source?: string;
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

/** Prefer env base (prod), else derive from request; force https and strip trailing slash. */
function getPreferredBase(req: NextRequest) {
  const envBase = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envBase && /^https?:\/\//i.test(envBase)) {
    return envBase.replace(/\/+$/, "");
  }
  const u = new URL(req.url);
  return `https://${u.host}`;
}

function getUserId(session: Session | null): string | null {
  const anyUser = (session as any)?.user ?? null;
  return (anyUser?.id as string | undefined) ?? null;
}

/** Simple CSV env helper */
function envCsv(name: string): string[] {
  const v = process.env[name]?.trim();
  return v ? v.split(",").map(s => s.trim()).filter(Boolean) : [];
}

export async function GET() {
  return NextResponse.json({ ok: false, message: "Method Not Allowed" }, { status: 405 });
}

export async function POST(req: NextRequest) {
  try {
    const session = (await getServerSession(authOptions)) as Session | null;
    const userId = getUserId(session);
    if (!userId) {
      return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
    }

    // ------------------ Rate Limit (with bypass) ------------------
    const BYPASS_IDS = envCsv("LINKMINT_RATE_LIMIT_BYPASS_IDS"); // CSV of user IDs
    const WINDOW_HOURS = Number(process.env.LINKMINT_RATE_LIMIT_HOURS ?? 24);
    const MAX_PER_WINDOW = Number(process.env.LINKMINT_RATE_LIMIT_MAX ?? 10);

    const isBypassed = BYPASS_IDS.includes(userId);

    if (!isBypassed) {
      const since = new Date(Date.now() - WINDOW_HOURS * 60 * 60 * 1000);
      const count = await prisma.smartLink.count({
        where: { userId, createdAt: { gte: since } },
      });

      if (count >= MAX_PER_WINDOW) {
        // Optional: log a warning event for audit
        await prisma.eventLog.create({
          data: {
            userId,
            type: "USER_WARNING",
            message: `RATE_LIMIT_LINK_CREATION: ${count} links in last ${WINDOW_HOURS}h`,
            detail: JSON.stringify({ count, windowHours: WINDOW_HOURS }),
            severity: 2,
          },
        });

        return NextResponse.json(
          {
            ok: false,
            message:
              `You’ve reached the limit of ${MAX_PER_WINDOW} links in ${WINDOW_HOURS} hour(s). ` +
              "Please try again later.",
          },
          { status: 429 }
        );
      }
    }
    // --------------------------------------------------------------

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

    const base = getPreferredBase(req); // e.g., https://em7262.linkmint.co
    const id = randomId(6);
    const shortUrl = `${base}/r/${id}`;

    const destinations: Prisma.InputJsonValue = {
      default: destinationUrl,
      source,
    };

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

    return NextResponse.json({ ok: true, id, shortUrl, merchant: merchantMeta.name });
  } catch (err) {
    console.error("smartlinks/create error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
