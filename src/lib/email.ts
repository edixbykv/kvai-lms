import nodemailer from "nodemailer";

const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email. When SMTP isn't configured, logs to console so flows
 * (verification, reset) still work in development.
 */
export async function sendMail({ to, subject, html, text }: MailOptions) {
  const from = process.env.SMTP_FROM || "KVAI LMS <no-reply@learn.kvai.in>";
  if (!configured) {
    console.log(`\n📧 [EMAIL — SMTP not configured]\nTo: ${to}\nSubject: ${subject}\n${text || html}\n`);
    return { queued: false, logged: true };
  }
  await getTransporter().sendMail({ from, to, subject, html, text });
  return { queued: true, logged: false };
}

export function baseEmailTemplate(title: string, body: string, cta?: { label: string; url: string }) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px">
    <div style="font-size:22px;font-weight:700;color:#15803d;margin-bottom:8px">KVAI LMS</div>
    <h1 style="font-size:20px;color:#111827;margin:16px 0 8px">${title}</h1>
    <div style="font-size:15px;color:#374151;line-height:1.6">${body}</div>
    ${
      cta
        ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;background:#15803d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600">${cta.label}</a>`
        : ""
    }
    <p style="margin-top:28px;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} KVAI Solutions · learn.kvai.in</p>
  </div>`;
}

export const isEmailConfigured = configured;
