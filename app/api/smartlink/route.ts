// app/api/smartlink/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ---- Inlined allow/deny helper ----
type SourceCheckResult = { ok: true } | { ok: false; reason: string };

function normalizeSource(s: string | null | undefined): string {
  return (s ?? "").trim().toLowerCase();
}

function validateSource(
  merchant: {
    merchantName: string;
    allowedSources?: unknown;
    disallowedSources?: unknown;
  },
  source: string
): SourceCheckResult {
  const src = normalizeSource(source);
  if (!src) return { ok: false, reason: "Missing source" };

  const toSet = (v: unknown): Set<string> => {
    if (Array.isArray(v)) {
      return new Set(
        v
          .map((x) => (typeof x === "string" ? x : String(x ?? "")))
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean)
      );
    }
    if (typeof v === "string") {
      return new Set(
        v
          .split(",")
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean)
      );
    }
    return new Set();
  };

  const allowed = toSet((merchant as any).allowedSources);
  const disallowed = toSet((merchant as any).disallowed);

  if (disallowed.has(src)) {
    return {
      ok: false,
      reason: `${merchant.merchantName}: the source "${source}" is not allowed by the merchant's program rules.`,
    };
  }
  if (allowed.size > 0 && !allowed.has(src)) {
    return {
      ok: false,
      reason: `${merchant.merchantName}: the source "${source}" is not in the allowed sources.`,
    };
  }
  return { ok: true };
}

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
  market?: string | null;
  allowedSources?: unknown;
};

async function findMerchantRuleByHost(hostname: string): Promise<RuleLite | null> {
  const host = hostname.toLowerCase().replace(/^www\./, "");

  // Try to find approved merchantRule first
  const rule = await prisma.merchantRule.findFirst({
    where: {
      OR: [
        { domainPattern: { contains: host } },
        { merchantName: { contains: host } },
      ],
      status: { in: ["approved", "active"] },
      active: true,
    },
  });

  // If not found, fallback to any PH-market merchantRule
  if (!rule) {
    const alt = await prisma.merchantRule.findFirst({
      where: {
        OR: [
          { domainPattern: { contains: host } },
          { merchantName: { contains: host } },
        ],
        market: "PH",
      },
    });
    if (alt) return alt as any;
  }

  return rule as any;
}

// ---- Handler ---------------------------------------------------------------
export async function POST(req: NextRequest) {
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  let userId = (session?.user as any)?.id as string | undefined;

  if (!userId) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = (token as any)?.sub || (token as any)?.id;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    url?: string;
    label?: string;
    source?: string;
  };
  const rawUrl = body?.url?.trim();
  const label = body?.label?.trim() || null;
  const source = (body?.source ?? "").trim();

  if (!rawUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const parsed = normalizeUrl(rawUrl);
  if (!parsed)
    return NextResponse.json(
      { error: "Invalid URL. Please include a full product URL." },
      { status: 400 }
    );

  const hostname = parsed.hostname;
  const rule = await findMerchantRuleByHost(hostname);

  // --- If still no rule found, create generic non-commission link
  if (!rule) {
    const generic = await prisma.smartLink.create({
      data: {
        userId,
        merchantRuleId: null,
        merchantName: hostname,
        merchantDomain: hostname,
        originalUrl: parsed.toString(),
        shortUrl: parsed.toString(),
        label,
      },
    });

    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const base = host ? `${proto}://${host}` : "";
    const shortUrl = base ? `${base}/l/${generic.id}` : `/l/${generic.id}`;

    return NextResponse.json({
      ok: true,
      link: shortUrl,
      shortUrl,
      warning: "No merchant rule matched; link may not earn commissions.",
    });
  }

  // --- Skip pending/inactive merchants
  if (!rule.active || !["approved", "active"].includes(rule.status ?? "")) {
    return NextResponse.json(
      {
        ok: false,
        error: "This merchant is not yet approved for commissions.",
        merchant: { name: rule.merchantName, status: rule.status ?? "INACTIVE" },
      },
      { status: 422 }
    );
  }

  // --- Enforce PH market
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

  // --- Create SmartLink
  const created = await prisma.smartLink.create({
    data: {
      userId,
      merchantRuleId: (rule as any).id,
      merchantName: rule.merchantName,
      merchantDomain: rule.domainPattern ?? hostname,
      originalUrl: parsed.toString(),
      shortUrl: parsed.toString(),
      label,
    },
  });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  const shortUrl = base ? `${base}/l/${created.id}` : `/l/${created.id}`;

  return NextResponse.json(
    {
      ok: true,
      link: shortUrl,
      shortUrl,
      merchant: {
        id: rule.id,
        name: rule.merchantName,
        status: rule.status ?? "ACTIVE",
        market: (rule as any).market ?? null,
      },
    },
    { status: 200 }
  );
}
