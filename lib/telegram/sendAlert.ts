// lib/telegram/sendAlert.ts

export async function sendAlert(message: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID;

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_USER_ID) {
    console.warn("Telegram bot token or user ID not set.");
    return;
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_USER_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  });
}
