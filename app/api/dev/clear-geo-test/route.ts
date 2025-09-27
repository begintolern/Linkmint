// app/api/dev/clear-geo-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET() {
  try {
    if (!ADMIN_EMAIL) {
      return NextResponse.json({ ok: false, error: "ADMIN_EMAIL not set" }, { status: 401 });
    }
    const admin = await prisma.user.findFirst({ where: { email: ADMIN_EMAIL }, select: { id: true } });
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
