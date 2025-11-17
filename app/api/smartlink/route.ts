// app/api/smartlink/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import {
  buildShopeeUrl,
  buildLazadaUrl,
  appendSubid,
} from "@/lib/affiliates/deeplink";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// Lazada PH via ACCESSTRADE (ATID short link for your account)
const LAZADA_PH_ACCESSTRADE_ATID = "https://atid.me/00p2cf002mmu";

// --- GET: simple probe to confirm route exists
export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "smartlink",
    methods: ["GET", "POST"],
  });
}

// ---------- helpers / types ----------
type SourceCheckResult = { ok: true } | { ok: false; reason: string };
type PostBody = { url?: string; label?: string; source?: string };

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

// Unwrap affiliate shorteners that pass the real product URL in a query param.
// Example: https://invl.me/... ?url=https%3A%2F%2Fus.shein.com%2F...
//          https://miniurl.app/... ?url=https%3A%2F%2Fwww.shein.com%2F...
function unwrapAffiliateWrapper(input: string): string {
  try {
    const raw = input.trim();
    const urlLike = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const u = new URL(urlLike);
    const qp =
      u.searchParams.get("url") ||
      u.searchParams.get("dest") ||
      u.searchParams.get("destination");
    if (qp) {
      try {
        return decodeURIComponent(qp);
      } catch {
        return qp;
      }
    }
    return input;
  } catch {
    return input;
  }
}

function validateSource(
  merchant: {
    merchantName: string;
    allowedSources?: unknown;
    disallowedSources?: unknown;
  },
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
  const disallowed = toSet((merchant as any).disallowedSources);

  if (disallowed.has(src)) {
    return {
      ok: false,
      reason: `${merchant.merchantName}: source "${source}" is disallowed by program rules.`,
    };
  }
  if (allowed.size > 0 && !allowed.has(src)) {
    return {
      ok: false,
      reason: `${merchant.merchantName}: source "${source}" is not in the allowed list.`,
    };
  }
  return { ok: true };
}

function normalizeUrl(input: string): URL | null {
  try {
    const u = new URL(
      /^https?:\/\//i.test(input) ? input.trim() : `https://${input.trim()}`
    );
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

async function findRuleByHost(hostname: string): Promise<RuleLite | null> {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  const rule = await prisma.merchantRule.findFirst({
    where: {
      OR: [
        { domainPattern: { contains: host } },
        { merchantName: { contains: host } },
      ],
      active: true,
    },
  });
  if (rule) return rule as any;

  const parts = host.split(".");
  if (parts.length > 2) {
    const tld = parts.slice(-2).join(".");
    const alt = await prisma.merchantRule.findFirst({
      where: {
        OR: [
          { domainPattern: { contains: tld } },
          { merchantName: { contains: tld } },
        ],
        active: true,
      },
    });
    if (alt) return alt as any;
  }
  return null;
}

// ---------- POST ----------
export async function POST(req: NextRequest) {
  // Auth (session or JWT)
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  let userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    userId = (token as any)?.sub || (token as any)?.id;
  }
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Input
  const body = ((await req.json().catch(() => ({}))) || {}) as PostBody;
  const rawUrl = body?.url?.trim();
  const label = body?.label?.trim() || null;
  const source = (body?.source ?? "").trim();

  if (!rawUrl)
    return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Parse the original URL (what the user pasted)
  const parsedOriginal = normalizeUrl(rawUrl);
  if (!parsedOriginal) {
    return NextResponse.json(
      { error: "Invalid URL. Please include a full product URL." },
      { status: 400 }
    );
  }

  // For merchant detection, unwrap affiliate wrappers like invl.me / miniurl.app
  const detectionTarget = unwrapAffiliateWrapper(rawUrl);
  const parsedForDetection =
    normalizeUrl(detectionTarget) || parsedOriginal;

  // Resolve merchant rule based on the REAL product host (e.g. shein.com)
  const hostname = parsedForDetection.hostname
    .toLowerCase()
    .replace(/^www\./, "");
  const rule = await findRuleByHost(hostname);

  // If no rule → generic link (use what the user pasted as destination)
  if (!rule) {
    const created = await prisma.smartLink.create({
      data: {
        userId,
        merchantRuleId: null,
        merchantName: hostname,
        merchantDomain: hostname,
        originalUrl: parsedOriginal.toString(),
        shortUrl: appendSubid(parsedOriginal.toString(), "generic"),
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
        warning:
          "No merchant rule matched; link may not earn commissions.",
      },
      { status: 200 }
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
      },
      { status: 400 }
    );
  }

  if (!isApproved && !isPH) {
    return NextResponse.json(
      {
        ok: false,
        error: "This merchant is not yet approved for commissions.",
        merchant: { name: rule.merchantName, status: rule.status ?? "INACTIVE" },
      },
      { status: 422 }
    );
  }

  // 1) Create SmartLink first to obtain subid
  const created = await prisma.smartLink.create({
    data: {
      userId,
      merchantRuleId: (rule as any).id,
      merchantName: rule.merchantName,
      merchantDomain: rule.domainPattern ?? hostname,
      originalUrl: parsedOriginal.toString(),
      shortUrl: "",
      label,
    },
  });

  // 2) Build tracked URL
  const merchantDomain = (rule.domainPattern || hostname).toLowerCase();
  const ruleNetwork = (rule.network || "").toLowerCase();

  let trackedUrl: string | null = null;

  const isShopeeHost = /(^|\.)shopee\.ph$/.test(merchantDomain);
  const isLazadaHost = /(^|\.)lazada\.com\.ph$/.test(merchantDomain);
  const isZaloraHost = /(^|\.)zalora\.com\.ph$/.test(merchantDomain);

  if (isShopeeHost || ruleNetwork.includes("shopee")) {
    trackedUrl = await buildShopeeUrl(parsedOriginal.toString(), created.id);
  } else if (isLazadaHost) {
    trackedUrl = `${LAZADA_PH_ACCESSTRADE_ATID}?url=${encodeURIComponent(
      parsedOriginal.toString()
    )}`;
  } else if (
    isZaloraHost ||
    ruleNetwork.includes("involve") ||
    ruleNetwork.includes("lazada") ||
    ruleNetwork.includes("zalora")
  ) {
    trackedUrl = await buildLazadaUrl(parsedOriginal.toString(), created.id);
  }

  if (!trackedUrl) {
    trackedUrl = appendSubid(parsedOriginal.toString(), created.id);
  }

  // 3) Save tracked URL
  await prisma.smartLink.update({
    where: { id: created.id },
    data: { shortUrl: trackedUrl },
  });

  // 4) Return short redirect URL
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
        market,
      },
    },
    { status: 200 }
  );
}
