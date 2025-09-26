// app/api/dev/seed-geo-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";

// Admin user id (from your memory/config)
const ADMIN_ID = "clwzud5zr0000v4l5gnkz1oz3";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions as any);
  const userId = (session as any)?.user?.id ?? null;

  if (!userId || userId !== ADMIN_ID) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const RULE_NAME = "Amazon (US Test)";
  const shortUrl = "TEST-US-ONLY";
  const originalUrl = "https://www.amazon.com/";

  // 1) Find or create MerchantRule (no reliance on unique fields)
  let rule = await prisma.merchantRule.findFirst({
    where: { merchantName: RULE_NAME },
  });

  if (!rule) {
    rule = await prisma.merchantRule.create({
      data: {
        merchantName: RULE_NAME,
        active: true,
        network: "amazon",
        domainPattern: "amazon.com",
        allowedSources: ["tiktok", "facebook", "direct"] as any,
        allowedCountries: ["US"] as any,
        blockedCountries: [] as any,
        baseCommissionBps: 500,
        notes: "Seeded for geo-gating test (US only)",
      } as any,
    });
  } else {
    rule = await prisma.merchantRule.update({
      where: { id: rule.id },
      data: {
        active: true,
        domainPattern: "amazon.com",
        allowedCountries: ["US"] as any,
        blockedCountries: [] as any,
        notes: "Seeded for geo-gating test (US only)",
      } as any,
    });
  }

  // 2) Find or create SmartLink by shortUrl (don’t assume unique)
  let link = await prisma.smartLink.findFirst({
    where: { shortUrl },
  });

  if (!link) {
    link = await prisma.smartLink.create({
      data: {
        shortUrl,
        originalUrl,
        merchantRuleId: rule.id,
        merchantName: RULE_NAME,
        merchantDomain: "amazon.com",
        userId,
      } as any,
    });
  } else {
    link = await prisma.smartLink.update({
      where: { id: link.id },
      data: {
        originalUrl,
        merchantRuleId: rule.id,
        merchantName: RULE_NAME,
        merchantDomain: "amazon.com",
        userId,
      } as any,
    });
  }

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co").replace(/\/+$/, "");
  const goUrl = `${base}/api/go/${encodeURIComponent(shortUrl)}`;

  return NextResponse.json({
    ok: true,
    merchantRuleId: rule.id,
    smartLinkId: link.id,
    shortUrl,
    originalUrl,
    goUrl,
    note: "This link should ONLY allow US traffic. Non-US IPs will see the geo-block page.",
  });
}
