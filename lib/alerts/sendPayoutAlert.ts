// lib/alerts/sendPayoutAlert.ts
import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendPayoutAlert(userEmail: string, amount: number) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("Telegram alert not sent: Missing credentials");
    return;
  }

  const message = `💸 Payout Sent!\n\nUser: ${userEmail}\nAmount: $${amount.toFixed(
    2
  )}\nStatus: ✅ Paid`;

  try {
    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
      }
    );
    console.log("Payout alert sent to Telegram");
  } catch (error) {
    console.error("Failed to send payout alert:", error);
  }
}
