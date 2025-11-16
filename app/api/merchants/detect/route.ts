// app/api/merchants/detect/route.ts
import { NextResponse } from "next/server";

/**
 * GET /api/merchants/detect?url=<productUrl>
 * Returns { ok:true, key:"lazada-ph", displayName:"Lazada PH (App)" } when matched
 */
export async function GET(req: Request) {
  try {
    const u = new URL(req.url);
    const raw = (u.searchParams.get("url") || "").trim();
    if (!raw) {
      return NextResponse.json(
        { ok: false, error: "MISSING_URL" },
        { status: 400 }
      );
    }

    let host = "";
    try {
      host = new URL(raw).hostname.toLowerCase();
    } catch {
      return NextResponse.json(
        { ok: false, error: "BAD_URL" },
        { status: 400 }
      );
    }

    // Lazada PH
    if (host.includes("lazada.com.ph")) {
      return NextResponse.json(
        {
          ok: true,
          key: "lazada-ph",
          displayName: "Lazada PH (App)",
        },
        { status: 200 }
      );
    }

    // Shopee PH
    if (host.includes("shopee.ph")) {
      return NextResponse.json(
        {
          ok: true,
          key: "shopee-ph",
          displayName: "Shopee PH",
        },
        { status: 200 }
      );
    }

    // Razer PH (via global razer.com, but we’ll treat it as PH for now)
    if (host.includes("razer.com")) {
      return NextResponse.json(
        {
          ok: true,
          key: "razer-ph",
          displayName: "Razer PH",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { ok: false, error: "NO_MATCH" },
      { status: 404 }
    );
  } catch (err: any) {
    console.error("GET /api/merchants/detect error:", err?.message || err);
    return NextResponse.json(
      { ok: false, error: "SERVER_ERROR" },
      { status: 500 }
    );
  }
}
