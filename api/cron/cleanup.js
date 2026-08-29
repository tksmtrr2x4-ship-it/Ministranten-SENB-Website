import { getDb } from "../../lib/db.js";

// Zusätzliches Sicherheitsnetz zum TTL-Index auf antraege.createdAt
// (siehe lib/db.js): löscht unbestätigte Anträge nach 30 Tagen, auch
// falls der TTL-Index z. B. wegen fehlender MongoDB-Rechte nicht greift.
// Wird per Vercel Cron aufgerufen (siehe vercel.json) und ist gegen
// öffentliche Aufrufe mit einem geheimen Header abgesichert.
export default async function handler(req, res) {
  const auth = req.headers.authorization;
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Nicht autorisiert" });
  }

  const db = await getDb();
  const grenze = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await db.collection("antraege").deleteMany({
    status: "ausstehend",
    createdAt: { $lt: grenze },
  });

  return res.status(200).json({ geloescht: result.deletedCount });
}
