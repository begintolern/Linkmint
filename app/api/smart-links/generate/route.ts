// app/api/smart-links/generate/route.ts
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextResponse } from "next/server";

/**
 * Minimal smart-link generator (provision mode).
 * Accepts: { url: string }
 * Returns: { ok: true, link: string }
 *
 * For now we just echo the original URL so the UI flow works.
 * Later, replace with real shortener logic and tracking.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const raw = (body?.url || body?.merchantUrl || "").trim();

    if (!raw) {
      return NextResponse.json(
        { ok: false, error: "Missing 'url' in body" },
        { status: 400 }
      );
    }

    // TODO: implement real shortener here (store & return /s/{code})
    // For provision mode, return the original URL so the UI can copy/share.
    return NextResponse.json({ ok: true, link: raw });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to generate smart link" },
      { status: 500 }
    );
  }
}
