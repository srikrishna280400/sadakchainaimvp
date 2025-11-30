// smtp_test.js — run with: node smtp_test.js
const nodemailer = require('nodemailer');

async function main() {
  // Replace the auth user/pass and host/port locally in the code BEFORE running.
  // Do not paste them anywhere public.
  const transporter = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io', // or your host
    port: 2525,                       // or 587
    auth: {
      user: '19e0a06414662f',
      pass: '65dc50c49cb697'
    },
    // debug: true,
  });

  try {
    const info = await transporter.sendMail({
      from: '"Civitas AI" <noreply@inbox.mailtrap.io>',
      to: 'tylerdurden9010@gmail.com', // put a real email you can view in Mailtrap
      subject: 'SMTP test from local nodemailer',
      text: 'This is a test. If you see this in Mailtrap, SMTP works.',
    });
    console.log('nodemailer: ok', info.messageId);
  } catch (err) {
    console.error('nodemailer: error', err && err.message ? err.message : err);
  }
}

main();