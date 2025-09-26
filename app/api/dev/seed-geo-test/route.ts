// app/api/dev/seed-geo-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const RULE_NAME = "Amazon (US Test)";
  const shortUrl = "TEST-US-ONLY";
  const originalUrl = "https://www.amazon.com/";

  // 1) Find or create MerchantRule
  let rule = await prisma.merchantRule.findFirst({ where: { merchantName: RULE_NAME } });
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
        allowedCountries: ["US"] as any,
        blockedCountries: [] as any,
        notes: "Seeded for geo-gating test (US only, updated)",
      } as any,
    });
  }

  // 2) Pick the first user in DB to own the smartlink
  const owner = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  const userId = owner?.id ?? null;

  // 3) Find or create SmartLink
  let link = await prisma.smartLink.findFirst({ where: { shortUrl } });
  if (!link) {
    link = await prisma.smartLink.create({
      data: {
        shortUrl,
        originalUrl,
        merchantRuleId: rule.id,
        merchantName: RULE_NAME,
        merchantDomain: "amazon.com",
        userId: userId!,
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
        userId: userId!,
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
    note: "Visit goUrl. US IP will redirect to Amazon; non-US will see geo-block page.",
  });
}
