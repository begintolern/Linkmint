// lib/notify.ts
/**
 * Optional Telegram notifier for admin alerts.
 * Safe-by-default: does nothing if env vars are missing.
 *
 * Required env:
 * - TELEGRAM_BOT_TOKEN
 * - TELEGRAM_CHAT_ID  (user or group ID)
 */

type WarningPayload = {
  userId: string;
  type: string;
  message: string;
  evidence?: unknown;
  createdAt?: string | Date;
};

function hasTelegramEnv() {
  return !!process.env.TELEGRAM_BOT_TOKEN && !!process.env.TELEGRAM_CHAT_ID;
}

function formatWarningText(w: WarningPayload) {
  const when =
    typeof w.createdAt === "string"
      ? w.createdAt
      : w.createdAt instanceof Date
      ? w.createdAt.toISOString()
      : new Date().toISOString();

  const evidenceSnippet =
    w.evidence ? `\nEvidence: \`${JSON.stringify(w.evidence).slice(0, 800)}\`` : "";

  return [
    `🚨 *User Warning*`,
    `Type: *${w.type}*`,
    `User: \`${w.userId}\``,
    `Time: ${when}`,
    `Message: ${w.message}`,
    evidenceSnippet,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function notifyWarning(warning: WarningPayload) {
  if (!hasTelegramEnv()) return; // silently skip if not configured

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  const text = formatWarningText(warning);

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
        disable_web_page_preview: true,
      }),
      // keep it ultra-fast; don’t block API response if Telegram is slow
      // @ts-ignore
      signal: AbortSignal.timeout ? AbortSignal.timeout(4000) : undefined,
    });

    // Soft-fail: don’t throw on Telegram errors
    if (!res.ok) {
      // eslint-disable-next-line no-console
      console.warn("[notifyWarning] Telegram send failed:", res.status, await res.text());
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[notifyWarning] error:", (err as any)?.message || err);
  }
}
