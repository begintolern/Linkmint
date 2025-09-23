// app/api/smartlink/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import { validateSource } from "../../../lib/merchants/validateSource"; // allow/deny guard

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ---- Helpers ---------------------------------------------------------------

function normalizeUrl(input: string): URL | null {
  try {
    const hasProto = /^https?:\/\//i.test(input.trim());
    const test = hasProto ? input.trim() : `https://${input.trim()}`;
    const u = new URL(test);
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

type RuleLite = {
  id: string;
  merchantName: string;
  network: string | null;
  domainPattern: string | null;
  active: boolean;
  status: string | null;
  inactiveReason: string | null;
  allowedRegions: string[] | null;

  // Optional fields if present in your schema:
  market?: string | null;      // e.g., "PH"
  allowedSources?: unknown;    // JSON/array
  // (disallowedSources may exist; we access via (rule as any).disallowedSources when validating)
};

async function findMerchantRuleByHost(hostname: string): Promise<RuleLite | null> {
  // Select ONLY fields compatible with RuleLite to avoid TS widening to object-of-arrays
  const rows = await prisma.merchantRule.findMany({
    select: {
      id: true,
      merchantName: true,
      network: true,
      domainPattern: true,
      active: true,
      status: true,
      inactiveReason: true,
      allowedRegions: true,

      // Optional fields (safe if your schema includes them)
      market: true,
      allowedSources: true,
      // Do NOT select disallowedSources; Prisma types may not include it yet
      // disallowedSources: true,
    },
  });

  const rules: RuleLite[] = rows as unknown as RuleLite[];

  const host = hostname.toLowerCase().replace(/^www\./, "");
  const match = rules.find((r) => {
    const dp = (r.domainPattern ?? "").toLowerCase().replace(/^www\./, "");
    return dp && (host === dp || host.endsWith("." + dp) || host.includes(dp));
  });

  return match ?? null;
}

// ---- Types -----------------------------------------------------------------

type PostBody = {
  url?: string;
  label?: string;
  // Optional traffic source; enforced if merchant has allow/deny lists.
  // e.g., "tiktok" | "instagram" | "facebook" | "youtube" | "email" | "paid search"
  source?: string;
};

// ---- Handler ---------------------------------------------------------------

export async function POST(req: NextRequest) {
  // 1) Auth: session first, then JWT fallback
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  let userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = (token as any)?.sub || (token as any)?.id;
  }
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Parse input
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const rawUrl = body?.url?.trim();
  const label = body?.label?.trim() || null;
  const source = (body?.source ?? "").trim();

  if (!rawUrl) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }
  const parsed = normalizeUrl(rawUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid URL. Please include a full product URL." },
      { status: 400 }
    );
  }

  // 3) Resolve merchant rule by hostname
  const hostname = parsed.hostname;
  const rule = await findMerchantRuleByHost(hostname);

  if (!rule) {
    // Create generic link (no commission rule matched)
    const generic = await prisma.smartLink.create({
      data: {
        userId,
        merchantRuleId: null,
        merchantName: hostname,
        merchantDomain: hostname,
        originalUrl: parsed.toString(),
        shortUrl: parsed.toString(), // TODO: integrate shortener
        label,
      },
      select: {
        id: true,
        merchantRuleId: true,
        merchantName: true,
        merchantDomain: true,
        originalUrl: true,
        shortUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      link: generic.shortUrl,
      smartUrl: generic.shortUrl,
      shortUrl: generic.shortUrl,
      warning: "No merchant rule matched; this link may not earn commissions.",
    });
  }

  // 4) Guard inactive/greyed merchants OR merchants still pending
  if (!rule.active || rule.status === "PENDING") {
    const reason =
      rule.inactiveReason ||
      (rule.status === "PENDING"
        ? "This merchant is not yet approved for commissions."
        : "This merchant is currently unavailable.");
    return NextResponse.json(
      {
        ok: false,
        error: reason,
        merchant: { name: rule.merchantName, status: rule.status ?? "INACTIVE" },
      },
      { status: 422 }
    );
  }

  // 5) PH-first enforcement — block non-PH merchants during PH launch
  if ((rule as any).market && (rule as any).market !== "PH") {
    return NextResponse.json(
      {
        ok: false,
        error: "MARKET_BLOCKED",
        reason: "This merchant is not enabled for the Philippines.",
        merchant: { id: rule.id, name: rule.merchantName, market: (rule as any).market },
      },
      { status: 400 }
    );
  }

  // 6) Enforce allowed/disallowed sources (only if the merchant defined them)
  const hasAllowList =
    Array.isArray((rule as any).allowedSources) && (rule as any).allowedSources.length > 0;
  const denyList = (rule as any).disallowedSources; // may be undefined
  const hasDenyList = Array.isArray(denyList) && denyList.length > 0;

  if (hasAllowList || hasDenyList) {
    if (!source) {
      return NextResponse.json(
        {
          ok: false,
          error: "SOURCE_REQUIRED",
          reason:
            "This merchant requires you to choose a traffic source (e.g., tiktok, instagram, facebook, youtube).",
        },
        { status: 400 }
      );
    }
    const check = validateSource(rule as any, source);
    if (!check.ok) {
      return NextResponse.json(
        { ok: false, error: "SOURCE_BLOCKED", reason: check.reason },
        { status: 400 }
      );
    }
  }

  // 7) Region note if not Global
  const regions = Array.isArray(rule.allowedRegions) ? rule.allowedRegions : [];
  const regionsNote =
    regions.length && !regions.includes("Global")
      ? `Commissions valid only in: ${regions.join(", ")}`
      : null;

  // 8) Create SmartLink (no `source` persisted yet)
  const created = await prisma.smartLink.create({
    data: {
      userId,
      merchantRuleId: (rule as any).id,
      merchantName: rule.merchantName,
      merchantDomain: rule.domainPattern ?? hostname,
      originalUrl: parsed.toString(),
      shortUrl: parsed.toString(), // TODO: integrate shortener
      label,
    },
    select: {
      id: true,
      merchantRuleId: true,
      merchantName: true,
      merchantDomain: true,
      originalUrl: true,
      shortUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      link: created.shortUrl,
      smartUrl: created.shortUrl,
      shortUrl: created.shortUrl,
      merchant: {
        id: (rule as any).id,
        name: rule.merchantName,
        status: rule.status ?? "ACTIVE",
        allowedRegions: regions,
        market: (rule as any).market ?? null,
      },
      ...(regionsNote ? { regionsNote } : {}),
    },
    { status: 200 }
  );
}
