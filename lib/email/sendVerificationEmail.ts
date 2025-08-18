// lib/email/sendVerificationEmail.ts
import sgMail from "@sendgrid/mail";

const FROM_EMAIL = "admin@linkmint.co";
const BASE =
  process.env.EMAIL_VERIFY_BASE_URL /* prefer explicit base */ ||
  process.env.NEXT_PUBLIC_APP_URL    /* fallback if set */ ||
  "https://linkmint.co";             /* final fallback */

export async function sendVerificationEmail(email: string, token: string) {
  if (!process.env.SENDGRID_API_KEY) throw new Error("Missing SENDGRID_API_KEY");
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const verifyUrl = `${BASE}/verify?token=${encodeURIComponent(token)}`;

  await sgMail.send({
    to: email,
    from: FROM_EMAIL,
    subject: "Verify your email",
    html: `
      <p>Welcome to linkmint.co!</p>
      <p>Click to verify: <a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 30 minutes.</p>
    `,
  });
}
