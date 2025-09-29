// lib/ops/alerts.ts
// Telegram ops alerts (feature-flagged) with robust env fallback + debug result

export async function sendOpsAlert(text: string) {
  if (process.env.OPS_ALERTS_ENABLED !== "1") {
    return { ok: false, reason: "alerts_disabled" as const };
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || "";
  const chatId =
    process.env.TELEGRAM_CHAT_ID ||
    process.env.TELEGRAM_ADMIN_CHAT_ID ||
    "";

  if (!token || !chatId) {
    return {
      ok: false,
      reason: "missing_config" as const,
      hasToken: !!token,
      hasChatId: !!chatId,
    };
  }

  try {
    const res = await (globalThis as any).fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      }
    );

    let body: any = null;
    try {
      body = await res.json();
    } catch {
      // ignore non-JSON
    }

    return { ok: res.ok, status: res.status, body };
  } catch (e: any) {
    return { ok: false, error: e?.message || String(e) };
  }
}
