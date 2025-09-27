// app/api/dev/seed-geo-test/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";

// Accept comma-separated emails in ADMIN_EMAIL
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAIL || process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdminUserId() {
  const admins = getAdminEmails();
  if (admins.length === 0) {
    throw new Error("ADMIN_EMAIL(S) not set");
  }
  const admin = await prisma.user.findFirst({
    where: { email: { in: admins } },
    select: { id: true, email: true },
  });
  if (!admin?.id) throw new Error("No admin user found for ADMIN_EMAIL(S)");
  return admin.id;
}

function buildNotesFromAllow(list: string[]): string {
  const allow = list.map((c) => c.toUpperCase().trim()).filter(Boolean);
  return `Seeded for geo-gating test. geo:allow=${allow.join(",")}`;
}

async function upsertRuleAndLink(opts: {
  ruleName: string;
  shortUrl: string;
  originalUrl: string;
  geoAllow: string[];
  ownerUserId: string;
}) {
  const { ruleName, shortUrl, originalUrl, geoAllow, ownerUserId } = opts;
  const notes = buildNotesFromAllow(geoAllow);

  // MerchantRule (notes-only; schema-agnostic)
  let rule = await prisma.merchantRule.findFirst({ where: { merchantName: ruleName } });
  rule = rule
    ? await prisma.merchantRule.update({ where: { id: rule.id }, data: { notes, active: true } })
    : await prisma.merchantRule.create({
        data: { merchantName: ruleName, active: true, notes } as any,
      });

  // SmartLink owned by admin
  let link = await prisma.smartLink.findFirst({ where: { shortUrl } });
  link = link
    ? await prisma.smartLink.update({
        where: { id: link.id },
        data: { originalUrl, merchantRuleId: rule.id, merchantName: ruleName, userId: ownerUserId },
      } as any)
    : await prisma.smartLink.create({
        data: { shortUrl, originalUrl, merchantRuleId: rule.id, merchantName: ruleName, userId: ownerUserId },
      } as any);

  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://linkmint.co").replace(/\/+$/, "");
  const goUrl = `${base}/api/go/${encodeURIComponent(shortUrl)}`;

  return { rule, link, goUrl, notes };
}

// ---------- GET: keep simple ?allow=... for existing TEST-US-ONLY ----------
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAdminUserId();

    const url = req.nextUrl;
    const allowParam = url.searchParams.get("allow"); // e.g. "PH" or "PH,US"
    const allowList = (allowParam ? allowParam.toUpperCase().replace(/\s+/g, "") : "US").split(",").filter(Boolean);

    const ruleName = "Amazon (Geo Test)";
    const shortUrl = "TEST-US-ONLY";
    const originalUrl = "https://www.amazon.com/";

    const { rule, link, goUrl, notes } = await upsertRuleAndLink({
      ruleName,
      shortUrl,
      originalUrl,
      geoAllow: allowList,
      ownerUserId: userId,
    });

    return NextResponse.json({
      ok: true,
      merchantRuleId: rule.id,
      smartLinkId: link.id,
      shortUrl,
      originalUrl,
      goUrl,
      note: notes.replace("Seeded for geo-gating test. ", ""),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}

// ---------- POST: accepts JSON { ruleName, shortUrl, originalUrl, geoAllow[] } ----------
export async function POST(req: NextRequest) {
  try {
    const userId = await requireAdminUserId();
    const body = await req.json().catch(() => ({}));

    const ruleName = (body.ruleName ?? "").toString().trim() || "Geo Test (PH)";
    const shortUrl = (body.shortUrl ?? "").toString().trim() || "TEST-GEO";
    const originalUrl = (body.originalUrl ?? "").toString().trim() || "https://example.com/";
    const geoAllowRaw: unknown = body.geoAllow;
    const geoAllow =
      Array.isArray(geoAllowRaw) && geoAllowRaw.length
        ? geoAllowRaw.map((x) => String(x))
        : ["PH"];

    const { rule, link, goUrl, notes } = await upsertRuleAndLink({
      ruleName,
      shortUrl,
      originalUrl,
      geoAllow,
      ownerUserId: userId,
    });

    return NextResponse.json({
      ok: true,
      merchantRuleId: rule.id,
      smartLinkId: link.id,
      shortUrl,
      originalUrl,
      goUrl,
      note: notes.replace("Seeded for geo-gating test. ", ""),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}
