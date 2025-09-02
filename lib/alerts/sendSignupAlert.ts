// lib/alerts/sendSignupAlert.ts
import { sendAlert } from "@/lib/alerts/sendAlert";

/** Telegram alert for new user signups */
export async function sendSignupAlert(email: string) {
  const msg = `👤 New signup: ${email}`;
  try {
    await sendAlert(msg);
  } catch (e) {
    console.error("sendSignupAlert failed:", e);
  }
}
