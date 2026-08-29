import { getDb } from "../lib/db.js";
import { sendMail } from "../lib/mailer.js";
import { GEMEINDEN } from "../lib/gemeinden.js";

// Double-Opt-In, zweiter Schritt: der Link aus der Bestätigungs-E-Mail landet
// hier. Erst jetzt gilt der Antrag als bestätigt, und erst jetzt informieren
// wir die Ansprechperson der Gemeinde – nicht schon bei der reinen Absendung
// des Formulars, die ja noch unbestätigt (und ggf. mit vertippter E-Mail) ist.
export default async function handler(req, res) {
  const token = req.query?.token || new URLSearchParams(req.url.split("?")[1] || "").get("token");

  if (!token) {
    res.statusCode = 302;
    res.setHeader("Location", "/anmeldung/fehler/");
    return res.end();
  }

  const db = await getDb();
  const antrag = await db.collection("antraege").findOne({ confirmToken: token });

  const abgelaufen = !antrag || (antrag.confirmTokenExpiresAt && new Date(antrag.confirmTokenExpiresAt) < new Date());

  if (!antrag || abgelaufen) {
    res.statusCode = 302;
    res.setHeader("Location", "/anmeldung/fehler/");
    return res.end();
  }

  if (antrag.status === "ausstehend") {
    await db.collection("antraege").updateOne(
      { _id: antrag._id },
      { $set: { status: "bestaetigt", bestaetigtAm: new Date() } }
    );

    const gemeinde = GEMEINDEN[antrag.gemeindeId];
    if (gemeinde) {
      const artText = antrag.antragsart === "mini" ? "Ministrant/in (inkl. KJS)" : "KJS";
      const kontakt = antrag.minderjaehrig
        ? `Sorgeberechtigte Person: ${antrag.kontakt.sorgeberechtigtName}, ${antrag.kontakt.sorgeberechtigtEmail}, ${antrag.kontakt.sorgeberechtigtTelefon}`
        : `Kontakt: ${antrag.kontakt.eigeneEmail}, ${antrag.kontakt.eigeneTelefon}`;

      try {
        await sendMail({
          to: gemeinde.ansprechpersonEmail,
          subject: `Neue bestätigte Anmeldung: ${antrag.vorname} ${antrag.nachname} (${gemeinde.name})`,
          text: [
            `Neue bestätigte Anmeldung für ${gemeinde.name}, ${gemeinde.ort}:`,
            ``,
            `Name: ${antrag.vorname} ${antrag.nachname}`,
            `Geburtsdatum: ${antrag.geburtsdatum}`,
            `Art: ${artText}`,
            `Minderjährig: ${antrag.minderjaehrig ? "ja" : "nein"}`,
            kontakt,
            antrag.minderjaehrig
              ? "Hinweis: Die unterschriebene Einverständniserklärung folgt noch auf Papier."
              : "",
          ].join("\n"),
        });
      } catch (err) {
        // Bestätigung selbst ist bereits gespeichert; ein fehlgeschlagener
        // Benachrichtigungsversand soll die Bestätigung für die anmeldende
        // Person nicht blockieren.
      }
    }
  }

  res.statusCode = 302;
  res.setHeader("Location", "/anmeldung/bestaetigt/");
  res.end();
}
