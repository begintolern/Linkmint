// app/api/merchants/detect/route.ts
import { NextResponse } from "next/server";

/**
 * GET /api/merchants/detect?url=<productUrl>
 * Returns { ok:true, key:"merchant-key", displayName:"Merchant Name" } when matched.
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

    // Lazada PH via ACCESSTRADE or Involve Asia
    if (host.includes("lazada.com.ph")) {
      return NextResponse.json(
        {
          ok: true,
          key: "lazada-ph",
          displayName: "Lazada PH",
          network: "involveasia",
        },
        { status: 200 }
      );
    }

    // Shopee PH via ACCESSTRADE or IA
    if (host.includes("shopee.ph")) {
      return NextResponse.json(
        {
          ok: true,
          key: "shopee-ph",
          displayName: "Shopee PH",
          network: "involveasia",
        },
        { status: 200 }
      );
    }

    // Razer (global razer.com) via Involve Asia
    if (host.includes("razer.com")) {
      return NextResponse.json(
        {
          ok: true,
          key: "razer-ph",
          displayName: "Razer (PH)",
          network: "involveasia",
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
