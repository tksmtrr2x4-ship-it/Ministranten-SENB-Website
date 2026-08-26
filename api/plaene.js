import { requireRole } from "./lib/session.js";

// Phase-2-Modul "Ministrantenpläne" (siehe Build-Prompt Abschnitt 8): Route
// und Rollenprüfung existieren bereits, die eigentliche Oberfläche (PDF-Upload,
// Anzeige je Gemeinde) ist noch nicht ausformuliert. Wichtig laut
// Abnahmekriterien: 403 statt 404 bei fehlender Berechtigung, und die Route
// darf nicht in Suchmaschinen auftauchen.
export default async function handler(req, res) {
  res.setHeader("X-Robots-Tag", "noindex");

  const session = requireRole(req, ["admin", "obermini", "ansprechperson"]);
  if (!session) {
    return res.status(403).json({ error: "Nicht autorisiert" });
  }

  return res.status(200).json({
    hinweis: "Modul Ministrantenpläne ist vorbereitet, aber noch nicht befüllt.",
    plaene: [],
  });
}
