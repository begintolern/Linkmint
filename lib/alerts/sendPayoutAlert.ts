// lib/alerts/sendPayoutAlert.ts
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function sendPayoutAlert({
  userEmail,
  amountPhp,
  method,
  id,
}: {
  userEmail: string;
  amountPhp: number;
  method: string;
  id: string;
}) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("Telegram alert skipped — env vars missing");
    return;
  }

  try {
    const msg = `💸 *New Payout Request*\n\n👤 ${userEmail}\n₱${amountPhp.toLocaleString()} via ${method}\n\nID: \`${id}\``;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: msg,
        parse_mode: "Markdown",
      }),
    });
  } catch (err) {
    console.error("Telegram alert failed:", err);
  }
}
