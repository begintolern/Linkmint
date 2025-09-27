// app/api/dev/seed-geo-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const allowParam = url.searchParams.get("allow"); // e.g. "PH" or "PH,US"
    const allowList = allowParam
      ? allowParam.toUpperCase().replace(/\s+/g, "")
      : "US";
    const notes = `Seeded for geo-gating test. geo:allow=${allowList}`;

    const RULE_NAME = "Amazon (Geo Test)";
    const shortUrl = "TEST-US-ONLY";
    const originalUrl = "https://www.amazon.com/";

    // 1) Minimal MerchantRule (only fields guaranteed to exist)
    let rule = await prisma.merchantRule.findFirst({
      where: { merchantName: RULE_NAME },
    });

    if (!rule) {
      rule = await prisma.merchantRule.create({
        data: {
          merchantName: RULE_NAME,
          active: true,
          notes,
        } as any,
      });
    } else {
      rule = await prisma.merchantRule.update({
        where: { id: rule.id },
        data: { notes },
      });
    }

    // 2) Pick first user as owner (safe select)
    const owner = await prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!owner?.id) throw new Error("No users found to own SmartLink");
    const userId = owner.id;

    // 3) Find or create SmartLink
    let link = await prisma.smartLink.findFirst({ where: { shortUrl } });
    if (!link) {
      link = await prisma.smartLink.create({
        data: {
          shortUrl,
          originalUrl,
          merchantRuleId: rule.id,
          merchantName: RULE_NAME,
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
      note: `Geo rule written to notes: geo:allow=${allowList}`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || String(err) },
      { status: 500 }
    );
  }
}
