// scripts/testSendgrid.ts
import sgMail from '@sendgrid/mail';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Fix __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Set API key
const apiKey = process.env.SENDGRID_API_KEY;

if (!apiKey || !apiKey.startsWith('SG.')) {
  console.error('❌ SENDGRID_API_KEY is missing or invalid');
  process.exit(1);
}

sgMail.setApiKey(apiKey);

// Send test email
sgMail
  .send({
    to: 'ertorig3@gmail.com', // 🔁 Replace with your real test email
    from: 'noreply@em7262.linkmint.co',   // ✅ Must be a verified sender in SendGrid
    subject: '✅ Linkmint Email Test',
    text: 'This is a test email sent via SendGrid from the Linkmint system.',
  })
  .then(() => {
    console.log('✅ Email sent successfully');
  })
  .catch((\1: any) => {
    console.error('❌ Email failed to send:');
    console.error(error.response?.body || error.message);
  });
