import { getDb, ensureIndexes } from "./lib/db.js";
import { getClientIp } from "./lib/privacy.js";
import { checkRateLimit } from "./lib/rateLimit.js";
import { sendMail } from "./lib/mailer.js";
import { sendMessagePage } from "./lib/renderPage.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body || {};

  const honeypotAusgefuellt = Boolean(body.website && String(body.website).trim() !== "");
  const geladenVor = Number(body.loadedAt || 0);
  const zuSchnell = geladenVor > 0 && Date.now() - geladenVor < 3000;
  if (honeypotAusgefuellt || zuSchnell) {
    res.statusCode = 303;
    res.setHeader("Location", "/kontakt-gesendet");
    return res.end();
  }

  const { name, email, message } = body;
  if (!name || !email || !message) {
    return sendMessagePage(res, {
      status: 422,
      title: "Bitte prüfen",
      heading: "Die Nachricht konnte nicht gesendet werden.",
      message: "Bitte fülle Name, E-Mail-Adresse und Nachricht aus.",
      backHref: "/kontakt",
      backLabel: "Zurück zum Formular",
    });
  }

  const db = await getDb();
  await ensureIndexes(db);
  const erlaubt = await checkRateLimit(db, { ip: getClientIp(req), route: "contact", max: 8, windowMs: 10 * 60 * 1000 });
  if (!erlaubt) {
    return sendMessagePage(res, {
      status: 429,
      title: "Bitte kurz warten",
      heading: "Zu viele Nachrichten in kurzer Zeit.",
      message: "Bitte versuche es in ein paar Minuten erneut.",
      backHref: "/kontakt",
      backLabel: "Zurück zum Formular",
    });
  }

  try {
    const settings = await db.collection("settings").findOne({ id: "general" });
    const toEmail = settings?.contactEmail || process.env.FALLBACK_EMAIL;

    await sendMail({
      to: toEmail,
      subject: `Neue Kontaktanfrage von ${name}`,
      text: `Name: ${name}\nE-Mail: ${email}\n\nNachricht:\n${message}`,
    });
  } catch (err) {
    return sendMessagePage(res, {
      status: 502,
      title: "Fehler beim Versand",
      heading: "Die Nachricht konnte nicht verschickt werden.",
      message: "Bitte versuche es später erneut oder schreibe direkt an die Ansprechperson deiner Gemeinde.",
      backHref: "/kontakt",
      backLabel: "Zurück zum Formular",
    });
  }

  res.statusCode = 303;
  res.setHeader("Location", "/kontakt-gesendet");
  res.end();
}
