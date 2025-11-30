// smtp_test.mjs  — run with: node smtp_test.mjs someone@domain.tld
import nodemailer from 'nodemailer';

const toArg = process.argv[2] || process.env.TO_EMAIL;
if (!toArg) {
  console.error('Usage: node smtp_test.mjs <recipient-email>  OR set TO_EMAIL env var');
  process.exit(1);
}

async function main() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: Number(process.env.SMTP_PORT || 2525),
    auth: {
      user: process.env.SMTP_USER || '19e0a06414662f',
      pass: process.env.SMTP_PASS || '65dc50c49cb697'
    },
    // secure: false, // mailtrap doesn't need TLS
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Civitas AI" <noreply@civitasai.in>',
      to: toArg,
      subject: 'SMTP test from local nodemailer',
      text: 'This is a test. If you see this in Mailtrap, SMTP works.',
      html: '<p>This is a test. If you see this in Mailtrap, SMTP works.</p>',
    });
    console.log('nodemailer: ok', info.messageId);
  } catch (err) {
    console.error('nodemailer: error', err && err.message ? err.message : err);
    process.exit(2);
  }
}

main();