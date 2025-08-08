// lib/alerts/sendPayoutAlert.ts
import { sendEmail } from "@/lib/email/sendEmail"; // <-- your existing helper if you have one

export async function sendPayoutAlert(userEmail: string, amount: number) {
  const to = process.env.PAYOUT_ALERT_EMAIL || "ops@linkmint.co";
  const subject = "Payout processed";
  const text = `Payout processed for ${userEmail} - $${amount.toFixed(2)}`;
  try {
    await sendEmail({ to, subject, text });
  } catch (e) {
    console.warn("[sendPayoutAlert] email failed (non-blocking):", e);
  }
}
