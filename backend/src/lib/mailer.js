import nodemailer from 'nodemailer';

// Recipient comes only from .env so no personal address is stored in the repository
export const CONTACT_TO = process.env.CONTACT_TO;

const transporter = CONTACT_TO && process.env.SMTP_USER && process.env.SMTP_PASS
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

export async function sendMail({ subject, text, replyTo }) {
  if (!transporter) {
    console.warn('CONTACT_TO/SMTP_USER/SMTP_PASS not set — email not sent:', subject);
    return false;
  }
  await transporter.sendMail({ from: `"Šećerless" <${process.env.SMTP_USER}>`, to: CONTACT_TO, replyTo, subject, text });
  return true;
}

