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

  // 3) For now, use the original URL as the "smart" link
  // (We will add a real shortener + redirect route later.)
  const shortUrl = originalUrl;

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
  } catch {
    // Retry without merchantRuleId if relation fails
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
  }

  // 5) Respond for the UI
  return NextResponse.json({ link: record.shortUrl });
}
