// app/api/admin/test-commission-alert/route.ts
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_USER_ID; // your user/chat id

  // The message we “would” send
  const text =
    "🔔 Test Commission Alert\n\nUser: demo-user\nAmount: $12.34\nSource: Example Network";

  // If env vars are missing, just simulate and tell the caller
  if (!token || !chatId) {
    console.warn("[test-commission-alert] Missing Telegram env vars");
    return NextResponse.json({
      success: true,
      simulated: true,
      message:
        "Telegram not configured in this environment; simulated send only.",
      preview: { chatId, text },
    });
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const resp = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    });

    const data = await resp.json();
    if (!resp.ok || !data?.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Telegram API error",
          details: data,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      sent: true,
      provider: "telegram",
      message: "Commission alert test sent.",
      telegramMessageId: data?.result?.message_id ?? null,
    });
  } catch (err: any) {
    console.error("[test-commission-alert] Failed:", err);
    return NextResponse.json(
      { success: false, error: "Send failed", details: String(err) },
      { status: 500 }
    );
  }
}
