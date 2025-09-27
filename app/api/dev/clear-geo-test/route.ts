// app/api/dev/clear-geo-test/route.ts
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

export async function GET() {
  try {
    const admins = getAdminEmails();
    if (admins.length === 0) {
      return NextResponse.json({ ok: false, error: "ADMIN_EMAIL(S) not set" }, { status: 401 });
    }
    const admin = await prisma.user.findFirst({
      where: { email: { in: admins } },
      select: { id: true, email: true },
    });
    if (!admin?.id) return NextResponse.json({ ok: false, error: "Admin user not found" }, { status: 401 });

    const RULE_NAME = "Amazon (Geo Test)";
    const shortUrl = "TEST-US-ONLY";

    const link = await prisma.smartLink.findFirst({ where: { shortUrl }, select: { id: true } });
    if (link) {
      await prisma.smartLink.delete({ where: { id: link.id } });
    }

    const rule = await prisma.merchantRule.findFirst({ where: { merchantName: RULE_NAME }, select: { id: true } });
    if (rule) {
      await prisma.merchantRule.delete({ where: { id: rule.id } });
    }

    return NextResponse.json({ ok: true, cleared: { rule: !!rule, smartLink: !!link } });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
