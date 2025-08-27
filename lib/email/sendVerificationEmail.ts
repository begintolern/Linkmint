// lib/email/sendVerificationEmail.ts
import nodemailer from "nodemailer";

function buildTransport() {
  if (process.env.EMAIL_SERVER) {
    return nodemailer.createTransport(process.env.EMAIL_SERVER);
  }
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER ?? process.env.EMAIL_FROM,
      pass: process.env.SMTP_PASS,
    },
  });
}

const transporter = buildTransport();

/**
 * Sends a verification email that points to the API route:
 *   /api/verify-email?token=...
 */
export async function sendVerificationEmail(to: string, tokenOrLink: string) {
  const base =
    process.env.EMAIL_VERIFY_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  // ALWAYS target the API endpoint
  const link = tokenOrLink.startsWith("http")
    ? tokenOrLink
    : `${base.replace(/\/$/, "")}/api/verify-email?token=${encodeURIComponent(
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
    console.log("[mail] sent", info.messageId, "->", to, "link:", link);
  }
}

export default sendVerificationEmail;
