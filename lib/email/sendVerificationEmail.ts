// lib/email/sendVerificationEmail.ts
import nodemailer from "nodemailer";

function buildLink(token: string) {
  const base =
    process.env.BASE_URL ||
    process.env.EMAIL_VERIFY_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "https://linkmint.co";

  const cleanBase = base.replace(/\/$/, "");
  return `${cleanBase}/api/auth/verify?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail(
  to: string,
  tokenOrLink: string
) {
  const link =
    tokenOrLink.startsWith("http") ? tokenOrLink : buildLink(tokenOrLink);

  const fromEmail = process.env.EMAIL_FROM || "admin@linkmint.co";

  console.log("[mail] prepare ->", { to, link });

  // --- Zoho SMTP only ---
  const host = process.env.SMTP_HOST ?? "smtp.zoho.com";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER ?? process.env.EMAIL_FROM;
  const pass = process.env.SMTP_PASS;

  console.log("[mail][smtp] config ->", {
    host,
    port,
    user,
    passSet: Boolean(pass),
  });

  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: false, // 587 + STARTTLS for Zoho
      auth: {
        user,
        pass,
      },
    });

    const info = await transport.sendMail({
      to,
      from: `linkmint.co <${fromEmail}>`,
      subject: "Verify your email for linkmint.co",
      text: `Verify your email: ${link}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.5;">
          <h2 style="margin:0 0 12px;">Verify your email</h2>
          <p>Tap the button below to verify your email for <strong>linkmint.co</strong>.</p>
          <p style="margin:24px 0;">
            <a href="${link}" 
               style="display:inline-block;padding:12px 18px;text-decoration:none;border-radius:6px;background:#0f766e;color:#fff;">
              Verify email
            </a>
          </p>
          <p>If the button doesn’t work, copy and paste this URL:</p>
          <p><a href="${link}">${link}</a></p>
        </div>
      `,
    });

    console.log("[mail][smtp] sent ->", info.messageId, "to", to);
  } catch (err: any) {
    console.error("[mail][smtp] error ->", to, err?.message || err, err);
    throw err; // TEMP: bubble up so we clearly see the failure
  }
}

export default sendVerificationEmail;
