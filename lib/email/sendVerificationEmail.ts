// lib/email/sendVerificationEmail.ts
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

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

export async function sendVerificationEmail(to: string, tokenOrLink: string) {
  const link =
    tokenOrLink.startsWith("http") ? tokenOrLink : buildLink(tokenOrLink);

  const fromEmail = process.env.EMAIL_FROM || "admin@linkmint.co";
  const fromName = process.env.SENDGRID_FROM_NAME || "linkmint.co";

  console.log("[mail] prepare ->", { to, link });

  // Prefer SendGrid on Railway/prod
  if (process.env.SENDGRID_API_KEY) {
    try {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      await sgMail.send({
        to,
        from: { email: fromEmail, name: fromName },
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
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
            <p style="color:#6b7280;font-size:12px;">If you didn’t request this, you can ignore this email.</p>
          </div>
        `,
      });
      console.log("[mail][sendgrid] sent ->", to);
    } catch (err: any) {
      console.error(
        "[mail][sendgrid] error ->",
        to,
        err?.response?.body || err
      );
    }
    return;
  }

  // Fallback SMTP (local dev)
  try {
    const transport =
      process.env.EMAIL_SERVER
        ? nodemailer.createTransport(process.env.EMAIL_SERVER)
        : nodemailer.createTransport({
            host: process.env.SMTP_HOST ?? "smtp.zoho.com",
            port: Number(process.env.SMTP_PORT ?? 587),
            secure: false,
            auth: {
              user: process.env.SMTP_USER ?? process.env.EMAIL_FROM,
              pass: process.env.SMTP_PASS,
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
    console.log("[mail][smtp] sent", info.messageId, "->", to);
  } catch (err) {
    console.error("[mail][smtp] error ->", to, err);
  }
}

export default sendVerificationEmail;
