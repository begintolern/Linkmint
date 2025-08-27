// /lib/email/sendVerificationEmail.ts
import nodemailer from "nodemailer";

/**
 * Uses Zoho SMTP (or any SMTP via EMAIL_SERVER URL) to send a verification email.
 * Required env:
 *  - EMAIL_FROM=admin@linkmint.co
 *  - EMAIL_SERVER=smtp://admin@linkmint.co:APP_PASSWORD@smtp.zoho.com:587
 * Optional (fallback if EMAIL_SERVER not set):
 *  - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 */
function buildTransport() {
  if (process.env.EMAIL_SERVER) {
    // Prefer a single SMTP URL when provided
    return nodemailer.createTransport(process.env.EMAIL_SERVER);
  }
  // Fallback discrete settings (also works with Zoho)
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false, // Zoho uses STARTTLS on 587
    auth: {
      user: process.env.SMTP_USER ?? process.env.EMAIL_FROM,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = buildTransport();

export async function sendVerificationEmail(to: string, tokenOrLink: string) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const link = tokenOrLink.startsWith("http")
    ? tokenOrLink
    : `${base.replace(/\/$/, "")}/verify?token=${encodeURIComponent(
        tokenOrLink
      )}`;

  const from = process.env.EMAIL_FROM!;
  const info = await transporter.sendMail({
    from: `Linkmint <${from}>`,
    to,
    subject: "Verify your email",
    text: `Welcome to Linkmint!\n\nPlease verify your email:\n${link}\n\nIf you didn’t sign up, you can ignore this message.`,
    html: `
      <p>Welcome to <strong>Linkmint</strong>!</p>
      <p><a href="${link}">Click here to verify your email</a></p>
      <p>Or copy and paste this link into your browser:</p>
      <p>${link}</p>
    `,
  });

  if (process.env.NODE_ENV !== "production") {
    console.log("[mail] sent", info.messageId);
  }
}

export default sendVerificationEmail;
