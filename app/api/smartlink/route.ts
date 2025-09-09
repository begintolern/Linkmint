// app/api/smartlink/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/options";
import { prisma } from "@/lib/db";
import fs from "fs";
import path from "path";

type Body = {
  url?: string;
  program?: "amazon" | "cj" | "iolo";
};

// -------- helpers --------
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

function buildCjLink(base: string, target: URL, sidKey: string, sidVal: string | null): string {
  const sidPart = sidVal ? `?${encodeURIComponent(sidKey)}=${encodeURIComponent(sidVal)}` : "";
  return `${base}${sidPart}`;
}

// --- iolo merchant config loader ---
function loadIoloBase(): string | null {
  const candidates = [
    ["config", "merchants", "iolo.json"],          // preferred: root/config
    ["app", "config", "merchants", "iolo.json"],   // fallback: app/config
  ];

  for (const parts of candidates) {
    const file = path.join(process.cwd(), ...parts);
    if (fs.existsSync(file)) {
      try {
        const json = JSON.parse(fs.readFileSync(file, "utf8"));
        const first = json?.links?.[0];
        const url: unknown = first?.url;
        if (typeof url === "string" && url.length > 0) return url;
      } catch {
        // ignore and try next
      }
    }
  }
  return null;
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

    const me = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true }
    });
    if (!me) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    let referralCode = me.referralCode ?? null;
    if (!referralCode) {
      referralCode = `lm_${me.id.slice(0, 8)}`;
      await prisma.user.update({ where: { id: me.id }, data: { referralCode } });
    }

    const AMAZON_TAG = (process.env.AMAZON_ASSOC_TAG || process.env.AMAZON_TAG) as string | undefined;
    const CJ_BASE = (process.env.CJ_DEEPLINK_BASE || process.env.CJ_LINK_BASE || "") as string;
    const CJ_SID_KEY = (process.env.CJ_SID_PARAM || "sid") as string;

    // pick program
    let program: "amazon" | "cj" | "iolo" =
      body?.program ?? (isAmazon(inputUrl) ? "amazon" : "iolo");

    let link: string | null = null;

    if (program === "amazon") {
      if (!AMAZON_TAG) {
        return NextResponse.json({ ok: false, error: "Missing AMAZON_ASSOC_TAG env" }, { status: 500 });
      }
      if (inputUrl.hostname.toLowerCase() === "amzn.to") {
        return NextResponse.json({ ok: false, error: "Please paste the full Amazon product URL (not amzn.to)." }, { status: 400 });
      }
      link = buildAmazonLink(inputUrl, AMAZON_TAG, referralCode);
    } else if (program === "iolo") {
      const base = loadIoloBase();
      if (!base) {
        return NextResponse.json({ ok: false, error: "iolo config missing or invalid" }, { status: 500 });
      }
      link = buildCjLink(base, inputUrl, CJ_SID_KEY, referralCode);
    } else {
      if (!CJ_BASE) {
        return NextResponse.json({ ok: false, error: "Missing CJ_DEEPLINK_BASE env" }, { status: 500 });
      }
      link = buildCjLink(CJ_BASE, inputUrl, CJ_SID_KEY, referralCode);
    }

    const origin = (process.env.NEXT_PUBLIC_SITE_URL as string | undefined) ?? new URL(req.url).origin;
    const smart = `${origin}/r?to=${encodeURIComponent(link!)}&sid=${encodeURIComponent(referralCode ?? "")}`;

    return NextResponse.json({ ok: true, link: smart, smartLink: smart });
  } catch (err: any) {
    console.error("POST /api/smartlink error:", err);
    return NextResponse.json({ ok: false, error: "Server error", detail: String(err?.message ?? err) }, { status: 500 });
  }
}
