// app/api/links/save/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
// import { prisma } from "@/lib/db"; // uncomment when you’re ready to persist

/**
 * POST /api/links/save
 * Body (example from /api/links/create response):
 * {
 *   merchant: { id: string, name: string, market?: string | null },
 *   normalizedUrl: string,
 *   source: "TikTok" | "Instagram" | "Facebook" | "YouTube" | "Blog/Website" | "Email (opt-in)" | "Search Ads" | "Other",
 *   acksAccepted?: string[]
 * }
 *
 * This is a NON-DESTRUCTIVE STUB:
 * - Ensures we were called only after validator signaled ready
 * - Validates minimal fields
 * - TODO: Persist to your Link table once schema is decided
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const merchant = body?.merchant;
    const normalizedUrl = String(body?.normalizedUrl || "");
    const source = String(body?.source || "");

    if (!merchant?.id || !merchant?.name || !normalizedUrl || !source) {
      return NextResponse.json(
        { ok: false, message: "Missing fields. Required: merchant{id,name}, normalizedUrl, source." },
        { status: 400 }
      );
    }

    // Example guard: require that /api/links/create has been used (normalizedUrl should be clean)
    try {
      // This will throw if not a valid URL (basic sanity, you can add stricter checks)
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json(
        { ok: false, message: "normalizedUrl is not a valid URL." },
        { status: 400 }
      );
    }

    // TODO: Persist when you have a Link model ready.
    // const saved = await prisma.link.create({ data: { ... } });

    return NextResponse.json({
      ok: true,
      saved: false, // change to true when persistence is wired
      echo: {
        merchant,
        normalizedUrl,
        source,
      },
      message: "Stub only. Link validated and ready to persist once schema is defined.",
    });
  } catch (err) {
    console.error("links/save POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Failed to save link." },
      { status: 500 }
    );
  }
}
