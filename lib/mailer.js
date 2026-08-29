import nodemailer from "nodemailer";

let cachedTransporter = null;

// Plattform: Gmail SMTP (smtp.gmail.com), als Vorgabe fest hinterlegt – siehe
// README.md für den Hinweis zu Google Workspace vs. privatem Gmail-Konto und
// App-Passwort. Per SMTP_HOST/SMTP_PORT/SMTP_SECURE überschreibbar, falls
// später doch ein anderer Anbieter (z. B. Diözesan-SMTP) genutzt wird.
export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return cachedTransporter;
}

export async function sendMail({ to, subject, text, attachments }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"Ministranten & KJS Neckar-Baar" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    attachments: attachments || [],
  });
}
