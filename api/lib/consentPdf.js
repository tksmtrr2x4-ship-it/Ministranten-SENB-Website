import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Erzeugt die Einverständniserklärung für Sorgeberechtigte als einfaches,
// druckfähiges PDF. Bewusst schlicht gehalten – reines Textformular, keine
// Corporate-Design-Ambitionen, damit es unkompliziert ausgedruckt und
// unterschrieben werden kann.
export async function buildConsentPdf({ vorname, nachname, geburtsdatum, gemeindeName, antragsart }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595.28, 841.89]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;
  const left = 56;
  const lineHeight = 18;

  function draw(text, { size = 11, useBold = false, gap = lineHeight } = {}) {
    page.drawText(text, { x: left, y, size, font: useBold ? bold : font, color: rgb(0.07, 0.14, 0.25) });
    y -= gap;
  }

  draw("Einverständniserklärung der Sorgeberechtigten", { size: 16, useBold: true, gap: 30 });
  draw("Ministrantinnen und Ministranten sowie KJS der Seelsorgeeinheit Neckar-Baar", { size: 10, gap: 26 });

  draw(`Name des Kindes: ${vorname} ${nachname}`);
  draw(`Geburtsdatum: ${geburtsdatum}`);
  draw(`Gemeinde: ${gemeindeName}`);
  draw(`Art der Anmeldung: ${antragsart}`, { gap: 30 });

  const absatz =
    "Hiermit erkläre(n) ich/wir als Sorgeberechtigte(r) mein/unser Einverständnis, dass das oben genannte " +
    "Kind an den Gruppenstunden, Gottesdiensten und Freizeiten der Ministrantinnen und Ministranten bzw. " +
    "der Katholischen Jugend Schwenningen (KJS) der Seelsorgeeinheit Neckar-Baar teilnimmt. Die online " +
    "abgegebenen Angaben und Einwilligungen zur Datenverarbeitung wurden zur Kenntnis genommen.";

  const words = absatz.split(" ");
  let line = "";
  const maxWidth = 483;
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    const width = font.widthOfTextAtSize(testLine, 11);
    if (width > maxWidth) {
      draw(line);
      line = word;
    } else {
      line = testLine;
    }
  });
  if (line) draw(line);

  y -= 40;
  draw("_____________________________________", { gap: lineHeight });
  draw("Ort, Datum, Unterschrift sorgeberechtigte Person 1", { size: 9 });

  y -= 30;
  draw("_____________________________________", { gap: lineHeight });
  draw("Ort, Datum, Unterschrift sorgeberechtigte Person 2 (falls vorhanden)", { size: 9 });

  y -= 40;
  draw(
    "Bitte ausdrucken, unterschreiben und bei der Ansprechperson der Gemeinde abgeben. Erst damit ist die Anmeldung vollständig.",
    { size: 9 }
  );

  return doc.save();
}
