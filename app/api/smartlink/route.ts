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
      market: true,
      allowedSources: true,
      // do not select disallowedSources to satisfy current Prisma types
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
  source?: string; // optional; validated if merchant defines allow/deny lists
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
        shortUrl: parsed.toString(), // placeholder; we'll return /l/:id below if needed
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

    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") ?? "https";
    const base = host ? `${proto}://${host}` : "";
    const shortUrl = base ? `${base}/l/${generic.id}` : `/l/${generic.id}`;

    return NextResponse.json({
      ok: true,
      link: shortUrl,
      smartUrl: shortUrl,
      shortUrl,
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
  const denyList = (rule as any).disallowed; // may be undefined
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

  // 8) Create SmartLink (DB)
  const created = await prisma.smartLink.create({
    data: {
      userId,
      merchantRuleId: (rule as any).id,
      merchantName: rule.merchantName,
      merchantDomain: rule.domainPattern ?? hostname,
      originalUrl: parsed.toString(),
      shortUrl: parsed.toString(), // placeholder; computed short returned below
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

  // Compute /l/:id short URL for response
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  const shortUrl = base ? `${base}/l/${created.id}` : `/l/${created.id}`;

  return NextResponse.json(
    {
      ok: true,
      link: shortUrl,
      smartUrl: shortUrl,
      shortUrl,
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
