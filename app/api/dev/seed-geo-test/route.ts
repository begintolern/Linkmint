// app/api/dev/seed-geo-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Accept comma-separated emails in ADMIN_EMAIL
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function GET(req: Request) {
  try {
    const admins = getAdminEmails();
    if (admins.length === 0) {
      return NextResponse.json({ ok: false, error: "ADMIN_EMAIL(S) not set" }, { status: 401 });
    }

    // Require that at least one admin email exists as a User (simple guard)
    const admin = await prisma.user.findFirst({
      where: { email: { in: admins } },
      select: { id: true, email: true },
    });
    if (!admin?.id) {
      return NextResponse.json({ ok: false, error: "No admin user found for ADMIN_EMAIL(S)" }, { status: 401 });
    }
    const userId = admin.id;

    const url = new URL(req.url);
    const allowParam = url.searchParams.get("allow"); // e.g. "PH" or "PH,US"
    const allowList = allowParam ? allowParam.toUpperCase().replace(/\s+/g, "") : "US";
    const notes = `Seeded for geo-gating test. geo:allow=${allowList}`;

    const RULE_NAME = "Amazon (Geo Test)";
    const shortUrl = "TEST-US-ONLY";
    const originalUrl = "https://www.amazon.com/";

    // MerchantRule (notes-only; schema-agnostic)
    let rule = await prisma.merchantRule.findFirst({ where: { merchantName: RULE_NAME } });
    rule = rule
      ? await prisma.merchantRule.update({ where: { id: rule.id }, data: { notes } })
      : await prisma.merchantRule.create({ data: { merchantName: RULE_NAME, active: true, notes } } as any);

    // SmartLink owned by the first matching admin
    let link = await prisma.smartLink.findFirst({ where: { shortUrl } });
    link = link
      ? await prisma.smartLink.update({
          where: { id: link.id },
          data: { originalUrl, merchantRuleId: rule.id, merchantName: RULE_NAME, userId },
        } as any)
      : await prisma.smartLink.create({
          data: { shortUrl, originalUrl, merchantRuleId: rule.id, merchantName: RULE_NAME, userId },
        } as any);

    const base = (process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co").replace(/\/+$/, "");
    const goUrl = `${base}/api/go/${encodeURIComponent(shortUrl)}`;

    return NextResponse.json({ ok: true, goUrl, note: `geo:allow=${allowList}` });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
