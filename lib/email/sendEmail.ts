// lib/email/sendEmail.ts
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail({ to, subject, text }: SendEmailParams) {
  const msg = {
    to,
    from: "admin@linkmint.co", // ✅ Verified sender
    subject,
    text,
  };

  try {
    await sgMail.send(msg);
  } catch (error) {
    console.error("SendGrid email error:", error);
  }
}
