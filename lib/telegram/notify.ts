import axios from "axios";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const TELEGRAM_USER_ID = process.env.TELEGRAM_USER_ID!;

export async function sendTelegramAlert(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    await axios.post(url, {
      chat_id: TELEGRAM_USER_ID,
      text: message,
    });
  } catch (err) {
    console.error("Failed to send Telegram alert:", err);
  }
}
