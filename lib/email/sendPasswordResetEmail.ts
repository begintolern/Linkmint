import nodemailer from "nodemailer";

function buildTransport() {
  if (process.env.EMAIL_SERVER) return nodemailer.createTransport(process.env.EMAIL_SERVER);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    auth: { user: process.env.SMTP_USER ?? process.env.EMAIL_FROM, pass: process.env.SMTP_PASS },
  });
}

const transporter = buildTransport();

export async function sendPasswordResetEmail(to: string, token: string) {
  const base =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";

  const link = `${base.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `Linkmint <${process.env.EMAIL_FROM!}>`,
    to,
    subject: "Reset your Linkmint password",
    text: `Reset your password:\n${link}\nThis link expires in 1 hour.`,
    html: `
      <p>Click to reset your password:</p>
      <p><a href="${link}">Reset Password</a></p>
      <p>If you didn’t request this, ignore this email.</p>
      <p>This link expires in 1 hour.</p>
    `,
  });
}
