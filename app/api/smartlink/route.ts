// app/api/smartlink/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InBody = {
  url?: string;
  merchantRuleId?: string | null;
  merchantName?: string;
  merchantDomain?: string | null;
  label?: string | null;
};

function normalizeUrl(raw?: string): string {
  const s = (raw ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://${s}`;
}

export async function POST(req: Request) {
  // 1) Auth
  const raw = await getServerSession(authOptions);
  const session = raw as Session | null;
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2) Parse & validate
  let body: InBody;
  try {
    body = (await req.json()) as InBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const originalUrl = normalizeUrl(body.url);
  if (!originalUrl) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  // Basic URL sanity
  try {
    const u = new URL(originalUrl);
    if (!u.hostname || !u.hostname.includes(".")) throw new Error("bad host");
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const merchantRuleId = body.merchantRuleId ?? null;
  const merchantName = (body.merchantName ?? "").trim() || "Merchant";
  const merchantDomain = body.merchantDomain?.trim() || null;
  const label = body.label?.trim() || null;

  // 3) Produce a short link value
  const slug = Math.random().toString(36).slice(2, 8);
  const shortBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_BASE_URL || "";
  const candidateShort =
    shortBase && /^https?:\/\//i.test(shortBase)
      ? `${shortBase.replace(/\/+$/, "")}/r/${slug}`
      : originalUrl;

  const shortUrl = candidateShort;

  // 4) Persist SmartLink record
  let record;
  try {
    record = await prisma.smartLink.create({
      data: {
        userId,
        merchantRuleId,
        merchantName,
        merchantDomain,
        originalUrl,
        shortUrl,
        label,
      },
      select: {
        id: true,
        shortUrl: true,
      },
    });
  } catch (e) {
    // Retry without merchantRuleId if relation fails
    try {
      record = await prisma.smartLink.create({
        data: {
          userId,
          merchantName,
          merchantDomain,
          originalUrl,
          shortUrl,
          label,
        },
        select: {
          id: true,
          shortUrl: true,
        },
      });
    } catch (e2) {
      console.error("[/api/smartlink] create failed:", e2);
      return NextResponse.json({ error: "Failed to save smart link" }, { status: 500 });
    }
  }

  // 5) Respond for the UI
  return NextResponse.json({ link: record.shortUrl });
}
