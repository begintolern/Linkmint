// app/api/smartlink/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Temporary PH affiliate map (no DB migration required)
const AFFILIATE_MAP: Record<string, string> = {
  "shopee.ph": "https://invl.me/cln2cek",
  "lazada.com.ph": "https://atid.me/00p2cf002mmu",
};

// --- quick GET to confirm route is live
export async function GET() {
  return NextResponse.json({ ok: true, route: "smartlink", methods: ["GET", "POST"] });
}

// ---------- allow/deny helper ----------
type SourceCheckResult = { ok: true } | { ok: false; reason: string };

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function validateSource(
  merchant: { merchantName: string; allowedSources?: unknown; disallowedSources?: unknown },
  source: string
): SourceCheckResult {
  const src = norm(source);
  if (!src) return { ok: false, reason: "Missing source" };

  const toSet = (v: unknown): Set<string> => {
    if (Array.isArray(v)) {
      return new Set(
        v
          .map((x) => (typeof x === "string" ? x : String(x ?? "")))
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      );
    }
    if (typeof v === "string") {
      return new Set(
        v
          .split(",")
          .map((x) => x.trim().toLowerCase())
          .filter(Boolean),
      );
    }
    return new Set();
  };

  const allowed = toSet((merchant as any).allowedSources);
  const disallowed = toSet((merchant as any).disallowedSources); // <-- fixed key

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

// ---------- helpers ----------
function normalizeUrl(input: string): URL | null {
  try {
    const hasProto = /^https?:\/\//i.test(input.trim());
    const u = new URL(hasProto ? input.trim() : `https://${input.trim()}`);
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
  // affiliateUrl?: string | null; // if you later add this column
};

async function findRuleByHost(hostname: string): Promise<RuleLite | null> {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const rule = await prisma.merchantRule.findFirst({
    where: {
      OR: [{ domainPattern: { contains: host } }, { merchantName: { contains: host } }],
      active: true,
    },
  });
  if (rule) return rule as any;

  const parts = host.split(".");
  if (parts.length > 2) {
    const tld = parts.slice(-2).join(".");
    const alt = await prisma.merchantRule.findFirst({
      where: {
        OR: [{ domainPattern: { contains: tld } }, { merchantName: { contains: tld } }],
        active: true,
      },
    });
    if (alt) return alt as any;
  }

  return null;
}

// ---------- handler ----------
type PostBody = { url?: string; label?: string; source?: string };

export async function POST(req: NextRequest) {
  // auth
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  let userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = (token as any)?.sub || (token as any)?.id;
  }
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // input
  const body = (await req.json().catch(() => ({}))) as PostBody;
  const rawUrl = body?.url?.trim();
  const label = body?.label?.trim() || null;
  const source = (body?.source ?? "").trim();

  if (!rawUrl) return NextResponse.json({ error: "Missing url" }, { status: 400 });
  const parsed = normalizeUrl(rawUrl);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid URL. Please include a full product URL." },
      { status: 400 },
    );
  }

  // resolve rule
  const hostname = parsed.hostname;
  const rule = await findRuleByHost(hostname);

  // no rule -> generic link (non-commission)
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

    return NextResponse.json(
      {
        ok: true,
        link: shortUrl,
        shortUrl,
        warning: "No merchant rule matched; link may not earn commissions.",
      },
      { status: 200 },
    );
  }

  // PH-first gating + approval
  const status = String(rule.status ?? "").toLowerCase();
  const market = (rule as any).market ?? null;
  const isApproved = status === "approved" || status === "active";
  const isPH = market === "PH";

  if (market && !isPH) {
    return NextResponse.json(
      {
        ok: false,
        error: "MARKET_BLOCKED",
        reason: `This merchant (${rule.merchantName}) is not enabled for the Philippines.`,
        merchant: { id: rule.id, name: rule.merchantName, market },
      },
      { status: 400 },
    );
  }

  if (!isApproved && isPH) {
    // allow but warn
  } else if (!isApproved) {
    return NextResponse.json(
      {
        ok: false,
        error: "This merchant is not yet approved for commissions.",
        merchant: { name: rule.merchantName, status: rule.status ?? "INACTIVE" },
      },
      { status: 422 },
    );
  }

  // allow/deny source lists
  const hasAllow =
    Array.isArray((rule as any).allowedSources) &&
    (rule as any).allowedSources.length > 0;
  const denyList = (rule as any).disallowedSources;
  const hasDeny = Array.isArray(denyList) && denyList.length > 0;

  if (hasAllow || hasDeny) {
    if (!source) {
      return NextResponse.json(
        {
          ok: false,
          error: "SOURCE_REQUIRED",
          reason:
            "This merchant requires a traffic source (tiktok, instagram, facebook, youtube).",
        },
        { status: 400 },
      );
    }
    const check = validateSource(rule as any, source);
    if (!check.ok)
      return NextResponse.json(
        { ok: false, error: "SOURCE_BLOCKED", reason: check.reason },
        { status: 400 },
      );
  }

  // Determine affiliate link
  const hostKey = hostname.replace(/^www\./, "").toLowerCase();
  const affiliateUrl =
    AFFILIATE_MAP[hostKey] ??
    (rule as any).affiliateUrl ?? // future-proof if you add this column later
    parsed.toString();

  // create smartlink
  const created = await prisma.smartLink.create({
    data: {
      userId,
      merchantRuleId: (rule as any).id,
      merchantName: rule.merchantName,
      merchantDomain: rule.domainPattern ?? hostname,
      originalUrl: parsed.toString(),
      shortUrl: affiliateUrl, // tracked link
      label,
    },
  });

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const base = host ? `${proto}://${host}` : "";
  const shortUrl = base ? `${base}/l/${created.id}` : `/l/${created.id}`;

  const payload: any = {
    ok: true,
    link: shortUrl,
    shortUrl,
    merchant: {
      id: rule.id,
      name: rule.merchantName,
      status: rule.status ?? "ACTIVE",
      market,
    },
  };
  if (!isApproved && isPH) {
    payload.warning =
      "Merchant is PENDING but PH-enabled; commissions may be limited until full approval.";
  }

  return NextResponse.json(payload, { status: 200 });
}
