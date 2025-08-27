// lib/email/sendVerificationEmail.ts
import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";

function buildLink(token: string) {
  const base =
    process.env.EMAIL_VERIFY_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/api/verify-email?token=${encodeURIComponent(
    token
  )}`;
}

export async function sendVerificationEmail(to: string, tokenOrLink: string) {
  const link =
    tokenOrLink.startsWith("http") ? tokenOrLink : buildLink(tokenOrLink);
  const from = process.env.EMAIL_FROM || "admin@linkmint.co";

  // Use SendGrid API if available (required on Railway)
  if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sgMail.send({
      to,
      from,
      subject: "Verify your email",
      text: `Verify your email: ${link}`,
      html: `
        <p>Welcome to <strong>Linkmint</strong>!</p>
        <p><a href="${link}">Click here to verify your email</a></p>
        <p>${link}</p>
      `,
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("[mail][sg] ->", to, "link:", link);
    }
    return;
  }

  // Fallback SMTP (for local dev only)
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
    from: `Linkmint <${from}>`,
    subject: "Verify your email",
    text: `Verify your email: ${link}`,
    html: `
      <p>Welcome to <strong>Linkmint</strong>!</p>
      <p><a href="${link}">Click here to verify your email</a></p>
      <p>${link}</p>
    `,
  });
  if (process.env.NODE_ENV !== "production") {
    console.log("[mail][smtp] sent", info.messageId, "->", to, "link:", link);
  }
}

export default sendVerificationEmail;
