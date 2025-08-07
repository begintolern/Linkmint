import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `https://linkmint.co/verify-email?token=${token}`;
  console.log("✅ Verification Link:", verifyUrl);

  const msg = {
    to: email,
    from: "verify@linkmint.co", // ✅ Correct verified sender
    subject: "Verify your Linkmint email",
    html: `
      <p>Welcome to Linkmint!</p>
      <p>Please verify your email by clicking the link below:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link will expire in 15 minutes.</p>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log("✅ Email sent to", email);
  } catch (error: any) {
    console.error("❌ SendGrid error:", error.response?.body || error.message);
  }
}
