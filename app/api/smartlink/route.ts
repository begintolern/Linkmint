// app/api/smartlink/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

type Body = {
  url?: string;
  program?: "amazon" | "cj";
};

function assertHttpUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("Invalid URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("Only http/https URLs are allowed");
  }
  return u;
}

function isAmazon(u: URL): boolean {
  const h = u.hostname.toLowerCase();
  return h === "amazon.com" || h.endsWith(".amazon.com");
}

function buildAmazonLink(u: URL, tag: string, subtag: string | null): string {
  [
    "psc","smid","spIA","spm","pd_rd_i","pd_rd_r","pd_rd_w","pd_rd_wg","th",
    "linkCode","creative","creativeASIN","ref_","ref","qid","sr"
  ].forEach((k) => u.searchParams.delete(k));
  u.searchParams.set("tag", tag);
  if (subtag) u.searchParams.set("ascsubtag", subtag);
  return u.toString();
}

function appendQuery(urlStr: string, key: string, val: string | null) {
  if (!val) return urlStr;
  const u = new URL(urlStr);
  u.searchParams.set(key, val);
  return u.toString();
}

// --- iolo merchant config loader (no deep-linking) ---
function loadIoloBase(): string | null {
  const file = path.join(process.cwd(), "app", "config", "merchants", "iolo.json");
  if (!fs.existsSync(file)) return null;
  const json = JSON.parse(fs.readFileSync(file, "utf8"));
  const first = json?.links?.[0];
  const url: unknown = first?.url;
  return typeof url === "string" ? url : null; // e.g. https://www.anrdoezrs.net/click-101525788-11054347
}

export async function POST(req: Request) {
  try {
    const session = (await getServerSession(authOptions)) as any;
    const userId: string | null = session?.user?.id ?? null;
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as Body;
    const rawUrl = (body?.url ?? "").trim();
    if (!rawUrl) {
      return NextResponse.json({ ok: false, error: "Missing url" }, { status: 400 });
    }

    const inputUrl = assertHttpUrl(rawUrl);

    // Ensure user has a referralCode
    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true },
    });
    if (!me) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    let referralCode = me.referralCode ?? null;
    if (!referralCode) {
      referralCode = `lm_${me.id.slice(0, 8)}`;
      await prisma.user.update({ where: { id: me.id }, data: { referralCode } });
    }

    const AMAZON_TAG = (process.env.AMAZON_ASSOC_TAG || process.env.AMAZON_TAG) as string | undefined;
    const program: "amazon" | "cj" = body?.program ?? (isAmazon(inputUrl) ? "amazon" : "cj");

    let networkLink: string;

    if (program === "amazon") {
      if (!AMAZON_TAG) {
        return NextResponse.json({ ok: false, error: "Missing AMAZON_ASSOC_TAG env" }, { status: 500 });
      }
      if (inputUrl.hostname.toLowerCase() === "amzn.to") {
        return NextResponse.json(
          { ok: false, error: "Please paste the full Amazon product URL (not amzn.to)." },
          { status: 400 }
        );
      }
      networkLink = buildAmazonLink(inputUrl, AMAZON_TAG, referralCode);
    } else {
      // CJ: handle iolo (NO deep-linking; do not add ?url=)
      const host = inputUrl.hostname.toLowerCase();
      if (host.endsWith("iolo.com")) {
        const base = loadIoloBase();
        if (!base) {
          return NextResponse.json({ ok: false, error: "iolo config missing or invalid" }, { status: 500 });
        }
        // Only append sid, never url=
        networkLink = appendQuery(base, "sid", referralCode);
      } else {
        // Not yet supported merchant: pass through without CJ wrapping
        networkLink = inputUrl.toString();
      }
    }

    // Wrap with our tracked redirect
    const origin = (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ?? new URL(req.url).origin;
    const smart = `${origin}/r?to=${encodeURIComponent(networkLink)}&sid=${encodeURIComponent(referralCode ?? "")}`;

    return NextResponse.json({ ok: true, link: smart, smartLink: smart });
  } catch (err: any) {
    console.error("POST /api/smartlink error:", err);
    return NextResponse.json(
      { ok: false, error: "Server error", detail: String(err?.message ?? err) },
      { status: 500 }
    );
  }
}
