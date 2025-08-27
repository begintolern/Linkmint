export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const asin = searchParams.get("asin");
    if (!asin) {
      return NextResponse.json({ success: false, error: "Missing asin" }, { status: 400 });
    }

    const tag = process.env.AMZ_PARTNER_TAG || "";
    const market = process.env.AMZ_MARKET || "www.amazon.com";

    // Simple fallback affiliate link
    const url = `https://${market}/dp/${asin}?tag=${tag}`;

    return NextResponse.json({ success: true, asin, url });
  } catch (e: any) {
    console.error("Amazon link route error:", e);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
