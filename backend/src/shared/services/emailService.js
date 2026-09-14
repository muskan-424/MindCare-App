const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

async function sendEmail({ to, subject, html, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`\n=================================== `);
    console.log(`EMAIL NOT SENT (SMTP not configured) — would have sent to ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(text || html);
    console.log(`===================================\n`);
    return { sent: false };
  }

  await t.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
    text,
  });
  return { sent: true };
}

async function sendLoginOtpEmail(to, otp) {
  return sendEmail({
    to,
    subject: 'Your MindCare login code',
    text: `Your MindCare login verification code is ${otp}. It expires in 10 minutes. If you didn't try to log in, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #46703b;">MindCare login verification</h2>
        <p>Use this code to finish signing in:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #46703b;">${otp}</p>
        <p style="color: #9DA3B4;">This code expires in 10 minutes. If you didn't try to log in, you can safely ignore this email.</p>
      </div>
    `,
  });
}

module.exports = { sendEmail, sendLoginOtpEmail };
