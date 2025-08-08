// scripts/testSendgrid.ts
import sgMail from "@sendgrid/mail";

async function main() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) throw new Error("SENDGRID_API_KEY not set");
  sgMail.setApiKey(apiKey);

  const msg = {
    to: "seeduser@test.com",
    from: "admin@linkmint.co",
    subject: "SendGrid Test",
    text: "This is a test email from Linkmint scripts.",
  };

  await sgMail.send(msg);
  console.log("SendGrid test email sent");
}

main().catch((e) => {
  console.error("SendGrid test failed:", e);
  process.exit(1);
});
