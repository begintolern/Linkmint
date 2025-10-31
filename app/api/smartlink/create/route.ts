// app/api/smartlink/create/route.ts
import { NextRequest, NextResponse } from "next/server";

type Body = {
  merchantId?: string;
  destinationUrl?: string;
  source?: string;
};

const MERCHANT_NAME_BY_ID: Record<string, string> = {
  cmfvvoxsj0000oij8u4oadeo5: "Lazada PH",
  cmfu940920003oikshotzltnp: "Shopee",
};

function randomId(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const merchantId = body.merchantId?.trim();
    const destinationUrl = body.destinationUrl?.trim();
    const source = body.source?.trim();

    if (!merchantId || !destinationUrl || !source) {
      return NextResponse.json(
        { ok: false, message: "Missing input. Required: merchantId, destinationUrl, source." },
        { status: 400 }
      );
    }

    try {
      new URL(destinationUrl);
    } catch {
      return NextResponse.json(
        { ok: false, message: "destinationUrl must be a valid URL (https://...)" },
        { status: 400 }
      );
    }

    const id = randomId(6);
    const host = new URL(destinationUrl).hostname;
    const shortUrl = `https://lm.to/${id}?t=${Date.now()}&m=${encodeURIComponent(host)}`;
    const merchant = MERCHANT_NAME_BY_ID[merchantId] ?? "Unknown";

    return NextResponse.json({
      ok: true,
      id,
      shortUrl,
      merchant,
    });
  } catch (err) {
    console.error("smartlink/create error:", err);
    return NextResponse.json({ ok: false, message: "Server error" }, { status: 500 });
  }
}
