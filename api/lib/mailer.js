import nodemailer from "nodemailer";

let cachedTransporter = null;

// Erwartet einen SMTP-Anbieter mit Sitz/AV-Vertrag in der EU (siehe README.md).
// Kein Versand über US-Dienste ohne AV-Vertrag nach KDG.
export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
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
