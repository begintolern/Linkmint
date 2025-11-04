import nodemailer from "nodemailer";

function buildTransport() {
  const hasUrl = !!process.env.EMAIL_SERVER;
  console.log("[password-reset] EMAIL_SERVER present:", hasUrl);

  if (hasUrl) return nodemailer.createTransport(process.env.EMAIL_SERVER as string);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.SMTP_USER ?? process.env.EMAIL_FROM,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const transporter = buildTransport();

  // ✅ Choose correct base automatically (works in dev + prod)
  const BASE_URL =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXTAUTH_URL ??
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

  const cleanBase = BASE_URL.replace(/\/$/, ""); // remove trailing slash
  const link = `${cleanBase}/reset-password?token=${encodeURIComponent(token)}`;

  await transporter.sendMail({
    from: `Linkmint <${process.env.EMAIL_FROM!}>`,
    to,
    subject: "Reset your Linkmint password",
    text: `Reset your password:\n${link}\nThis link expires in 1 hour.`,
    html: `<p>Click to reset your password:</p>
           <p><a href="${link}">Reset Password</a></p>
           <p>If you didn’t request this, ignore this email.</p>
           <p>This link expires in 1 hour.</p>`,
  });

  console.log("[password-reset] sent to:", to, "link:", link);
}
