// app/api/dev/test-telegram-direct/route.ts
import { NextResponse } from "next/server";

/**
 * Dev-only endpoint to test Telegram connectivity.
 * GET /api/dev/test-telegram-direct
 */
export async function GET() {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID; // ← YOUR REAL VARIABLE

    if (!token || !chatId) {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in env.",
          hasToken: !!token,
          hasChatId: !!chatId,
        },
        { status: 500 }
      );
    }

    const resp = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "🔔 Test alert from linkmint.co dev environment",
        }),
      }
    );

    const data = await resp.json().catch(() => ({}));

    return NextResponse.json({
      ok: resp.ok,
      status: resp.status,
      telegramOk: data?.ok ?? null,
      telegramDescription: data?.description ?? null,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
