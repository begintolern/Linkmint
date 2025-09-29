// app/api/ops/alerts/diag/route.ts
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST() {
  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || "";

  if (!token || !chatId) {
    return NextResponse.json({ ok: false, error: "MISSING_TELEGRAM_CONFIG", token: !!token, chatId: !!chatId }, { status: 400 });
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const payload = { chat_id: chatId, text: `[OPS DIAG] ${new Date().toISOString()}`, disable_web_page_preview: true };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    let body: any = null;
    try { body = await res.json(); } catch { /* ignore non-JSON */ }

    return NextResponse.json({ ok: res.ok, status: res.status, body });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
