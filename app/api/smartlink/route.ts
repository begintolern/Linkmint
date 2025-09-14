// app/api/smartlink/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

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
};

async function findMerchantRuleByHost(hostname: string): Promise<RuleLite | null> {
  // pull all rules; for large tables, consider indexing and filtering by domain
  const rules: RuleLite[] = await prisma.merchantRule.findMany({
    select: {
      id: true,
      merchantName: true,
      network: true,
      domainPattern: true,
      active: true,
      status: true,
      inactiveReason: true,
      allowedRegions: true,
    },
  });

  const host = hostname.toLowerCase().replace(/^www\./, "");
  const match = rules.find((r) => {
    const dp = (r.domainPattern ?? "").toLowerCase().replace(/^www\./, "");
    return dp && (host === dp || host.endsWith("." + dp) || host.includes(dp));
  });

  return match ?? null;
}

// ---- Types -----------------------------------------------------------------

type PostBody = { url?: string; label?: string };

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
  // 5) Region note if not Global
  const regions = Array.isArray(rule.allowedRegions) ? rule.allowedRegions : [];
  const regionsNote =
    regions.length && !regions.includes("Global")
      ? `Commissions valid only in: ${regions.join(", ")}`
      : null;

  // 6) Create SmartLink
  const created = await prisma.smartLink.create({
    data: {
      userId,
      merchantRuleId: rule.id,
      merchantName: rule.merchantName,
      merchantDomain: rule.domainPattern ?? hostname,
      originalUrl: parsed.toString(),
      shortUrl: parsed.toString(), // TODO: integrate shortener
      label,
    },
  });

  return NextResponse.json(
    {
      ok: true,
      link: created.shortUrl,
      smartUrl: created.shortUrl,
      shortUrl: created.shortUrl,
      merchant: {
        id: rule.id,
        name: rule.merchantName,
        status: rule.status ?? "ACTIVE",
        allowedRegions: regions,
      },
      ...(regionsNote ? { regionsNote } : {}),
    },
    { status: 200 }
  );
}
