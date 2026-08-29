import { randomBytes } from "crypto";
import { getDb, ensureIndexes } from "./lib/db.js";
import { getClientIp, anonymizeIp } from "./lib/privacy.js";
import { checkRateLimit } from "./lib/rateLimit.js";
import { sendMail } from "./lib/mailer.js";
import { buildConsentPdf } from "./lib/consentPdf.js";
import { sendMessagePage } from "./lib/renderPage.js";
import { GEMEINDEN } from "./lib/gemeinden.js";

const CONFIRM_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 Tage, siehe §5.3

function berechneAlter(geburtsdatumStr) {
  const geb = new Date(geburtsdatumStr);
  if (Number.isNaN(geb.getTime())) return null;
  const heute = new Date();
  let alter = heute.getFullYear() - geb.getFullYear();
  const monatsDiff = heute.getMonth() - geb.getMonth();
  if (monatsDiff < 0 || (monatsDiff === 0 && heute.getDate() < geb.getDate())) alter--;
  return alter;
}

function fehlerListe(body) {
  const fehler = [];
  const req = (feld, text) => {
    if (!body[feld] || String(body[feld]).trim() === "") fehler.push(text);
  };

  req("vorname", "Bitte gib den Vornamen an.");
  req("nachname", "Bitte gib den Nachnamen an.");
  req("geburtsdatum", "Bitte gib das Geburtsdatum an, damit wir wissen, ob wir die Einwilligung der Eltern brauchen.");
  if (!GEMEINDEN[body.gemeinde]) fehler.push("Bitte wähle eine gültige Gemeinde aus.");
  req("strasse", "Bitte gib Straße und Hausnummer an.");
  if (!/^\d{5}$/.test(String(body.plz || "").trim())) fehler.push("Bitte gib eine gültige, fünfstellige Postleitzahl an.");
  req("ort", "Bitte gib den Wohnort an.");

  if (!["mini", "kjs", "beides"].includes(body.antragsart)) {
    fehler.push("Bitte wähle eine Antragsart aus: Ministrant/in, KJS oder Beides.");
  }

  const brauchtErstkommunion = body.antragsart === "mini" || body.antragsart === "beides";
  if (brauchtErstkommunion && !["ja", "geplant", "nein"].includes(body.erstkommunion)) {
    fehler.push("Bitte gib an, ob die Erstkommunion bereits empfangen wurde oder geplant ist.");
  }

  const alter = berechneAlter(body.geburtsdatum);
  const minderjaehrig = alter === null || alter < 18;

  if (minderjaehrig) {
    req("sorgeberechtigtName", "Bitte gib den Namen einer sorgeberechtigten Person an.");
    req("sorgeberechtigtEmail", "Bitte gib die E-Mail-Adresse einer sorgeberechtigten Person an.");
    req("sorgeberechtigtTelefon", "Bitte gib die Telefonnummer einer sorgeberechtigten Person an.");
  } else {
    req("eigeneEmail", "Bitte gib deine E-Mail-Adresse an.");
    req("eigeneTelefon", "Bitte gib deine Telefonnummer an.");
  }

  if (body.consentDaten !== "ja") {
    fehler.push("Ohne die Einwilligung zur Datenverarbeitung können wir die Anmeldung leider nicht bearbeiten.");
  }

  return { fehler, minderjaehrig, alter };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendMessagePage(res, {
      status: 405,
      title: "Nicht erlaubt",
      heading: "Diese Anfrageart wird nicht unterstützt.",
      message: "Bitte nutze das Anmeldeformular.",
      backHref: "/anmeldung/",
      backLabel: "Zur Anmeldung",
    });
  }

  const body = req.body || {};
  const ip = getClientIp(req);

  // Honeypot + Zeitmessung: für Formular-Bots unsichtbar tun, als sei alles
  // gutgegangen, ohne irgendetwas zu verarbeiten oder zu speichern.
  const honeypotAusgefuellt = Boolean(body.website && String(body.website).trim() !== "");
  const geladenVor = Number(body.loadedAt || 0);
  const zuSchnell = geladenVor > 0 && Date.now() - geladenVor < 3000;
  if (honeypotAusgefuellt || zuSchnell) {
    res.statusCode = 303;
    res.setHeader("Location", "/anmeldung/eingegangen/");
    return res.end();
  }

  const db = await getDb();
  await ensureIndexes(db);

  const erlaubt = await checkRateLimit(db, { ip, route: "register", max: 5, windowMs: 10 * 60 * 1000 });
  if (!erlaubt) {
    return sendMessagePage(res, {
      status: 429,
      title: "Bitte kurz warten",
      heading: "Zu viele Anmeldeversuche.",
      message: "Von dieser Verbindung wurden in kurzer Zeit mehrere Anmeldungen abgeschickt. Bitte versuche es in ein paar Minuten erneut.",
      backHref: "/anmeldung/",
      backLabel: "Zurück zur Anmeldung",
    });
  }

  const { fehler, minderjaehrig, alter } = fehlerListe(body);
  if (fehler.length > 0) {
    const liste = fehler.map((f) => `<li>${f}</li>`).join("");
    return sendMessagePage(res, {
      status: 422,
      title: "Bitte prüfen",
      heading: "Die Anmeldung konnte nicht gespeichert werden.",
      message: `<ul class="kicker-list kicker-list--errors">${liste}</ul>`,
      backHref: "/anmeldung/",
      backLabel: "Zurück zum Formular",
    });
  }

  const istMiniAntrag = body.antragsart === "mini" || body.antragsart === "beides";
  const normalisierteAntragsart = body.antragsart === "kjs" ? "kjs" : "mini";
  const kjsMitgliedschaft = istMiniAntrag ? true : body.kjsMitgliedschaft === "ja";

  const gemeinde = GEMEINDEN[body.gemeinde];
  const confirmToken = randomBytes(32).toString("hex");
  const now = new Date();

  const antrag = {
    vorname: String(body.vorname).trim(),
    nachname: String(body.nachname).trim(),
    geburtsdatum: body.geburtsdatum,
    alterBeiAnmeldung: alter,
    minderjaehrig,
    gemeindeId: body.gemeinde,
    strasse: String(body.strasse).trim(),
    plz: String(body.plz).trim(),
    ort: String(body.ort).trim(),
    erstkommunion: {
      status: body.erstkommunion || null,
      datum: body.erstkommunionDatum || null,
    },
    koerpergroesseCm: body.koerpergroesseCm ? Number(body.koerpergroesseCm) : null,
    antragsart: normalisierteAntragsart,
    kjsMitgliedschaft,
    kontakt: minderjaehrig
      ? {
          sorgeberechtigtName: String(body.sorgeberechtigtName).trim(),
          sorgeberechtigtEmail: String(body.sorgeberechtigtEmail).trim(),
          sorgeberechtigtTelefon: String(body.sorgeberechtigtTelefon).trim(),
          kindEmail: body.kindEmail ? String(body.kindEmail).trim() : null,
          kindTelefon: body.kindTelefon ? String(body.kindTelefon).trim() : null,
        }
      : {
          eigeneEmail: String(body.eigeneEmail).trim(),
          eigeneTelefon: String(body.eigeneTelefon).trim(),
        },
    consent: {
      daten: true,
      datenZeitpunkt: now,
      fotos: body.consentFotos === "ja",
      whatsapp: body.consentWhatsapp === "ja",
    },
    status: "ausstehend",
    confirmToken,
    confirmTokenExpiresAt: new Date(now.getTime() + CONFIRM_TOKEN_TTL_MS),
    createdAt: now,
    createdFromIpTruncated: anonymizeIp(ip),
  };

  await db.collection("antraege").insertOne(antrag);

  const bestaetigungsEmail = minderjaehrig ? antrag.kontakt.sorgeberechtigtEmail : antrag.kontakt.eigeneEmail;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || "https";
  const confirmUrl = `${protocol}://${host}/api/confirm?token=${confirmToken}`;

  const artText = normalisierteAntragsart === "mini" ? "Ministrant/in (inkl. KJS)" : "KJS";

  const attachments = [];
  if (minderjaehrig) {
    const pdfBytes = await buildConsentPdf({
      vorname: antrag.vorname,
      nachname: antrag.nachname,
      geburtsdatum: antrag.geburtsdatum,
      gemeindeName: `${gemeinde.name}, ${gemeinde.ort}`,
      antragsart: artText,
    });
    attachments.push({
      filename: "Einverstaendniserklaerung.pdf",
      content: Buffer.from(pdfBytes),
      contentType: "application/pdf",
    });
  }

  try {
    await sendMail({
      to: bestaetigungsEmail,
      subject: "Bitte bestätige die Anmeldung – Ministranten & KJS Neckar-Baar",
      text: [
        `Hallo,`,
        ``,
        `für ${antrag.vorname} ${antrag.nachname} ist eine Anmeldung als ${artText} bei der Gemeinde ${gemeinde.name} (${gemeinde.ort}) eingegangen.`,
        ``,
        `Bitte bestätige die Anmeldung über diesen Link:`,
        confirmUrl,
        ``,
        minderjaehrig
          ? "Da die angemeldete Person noch nicht volljährig ist, liegt dieser E-Mail zusätzlich eine Einverständniserklärung als PDF bei. Bitte ausdrucken, unterschreiben lassen und bei der Ansprechperson der Gemeinde abgeben – erst damit ist die Anmeldung vollständig."
          : "Falls diese Anmeldung nicht von dir stammt, kannst du diese E-Mail einfach ignorieren.",
      ].join("\n"),
      attachments,
    });
  } catch (err) {
    // Der Antrag ist gespeichert; nur der Mailversand ist fehlgeschlagen.
    // Wir melden das ehrlich, statt eine falsche Erfolgsseite zu zeigen.
    return sendMessagePage(res, {
      status: 502,
      title: "E-Mail konnte nicht versendet werden",
      heading: "Die Anmeldung wurde gespeichert, die Bestätigungs-E-Mail konnte aber nicht verschickt werden.",
      message: "Bitte melde dich über die Kontaktseite, damit wir die Anmeldung manuell bestätigen können.",
      backHref: "/kontakt/",
      backLabel: "Zur Kontaktseite",
    });
  }

  res.statusCode = 303;
  res.setHeader("Location", "/anmeldung/eingegangen/");
  res.end();
}
