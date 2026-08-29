// Maßgebliche Gliederung der Seelsorgeeinheit (Kroatische Gemeinde auf
// ausdrücklichen Wunsch nicht berücksichtigt). ansprechpersonEmail ist ein
// Platzhalter – bitte vor Go-Live durch die echte Adresse ersetzen oder aus
// einer Umgebungsvariable je Gemeinde laden.
export const GEMEINDEN = {
  "st-franziskus": {
    name: "St. Franziskus",
    ort: "VS-Schwenningen",
    ansprechperson: "Nicole Tischler-Hauser",
    ansprechpersonEmail: process.env.KONTAKT_ST_FRANZISKUS || "platzhalter@senb.de",
  },
  "maria-himmelfahrt": {
    name: "Mariä Himmelfahrt",
    ort: "VS-Schwenningen",
    ansprechperson: "Miriam Raudszus",
    ansprechpersonEmail: process.env.KONTAKT_MARIA_HIMMELFAHRT || "platzhalter@senb.de",
  },
  "st-georg": {
    name: "St. Georg",
    ort: "VS-Mühlhausen",
    ansprechperson: "Ines Frech",
    ansprechpersonEmail: process.env.KONTAKT_ST_GEORG || "platzhalter@senb.de",
  },
  "st-anna": {
    name: "St. Anna",
    ort: "Tuningen",
    ansprechperson: "Lucia Feuerstein",
    ansprechpersonEmail: process.env.KONTAKT_ST_ANNA || "platzhalter@senb.de",
  },
  "st-otmar": {
    name: "St. Otmar",
    ort: "VS-Weigheim",
    ansprechperson: "Thomas Hils",
    ansprechpersonEmail: process.env.KONTAKT_ST_OTMAR || "platzhalter@senb.de",
  },
};
