import { getDb } from "../lib/db.js";

// Öffentliche, nicht personenbezogene Daten (News-Liste, allgemeine
// Einstellungen). Kein Aufruf externer Drittanbieter-APIs mehr – die
// Website darf im Netzwerk-Tab keine Requests an fremde Domains zeigen.
export default async function handler(req, res) {
  try {
    const db = await getDb();
    const news = await db.collection("news").find().sort({ timestamp: -1 }).limit(20).toArray();
    const settings = await db.collection("settings").findOne({ id: "general" });

    res.status(200).json({
      news,
      settings: settings || { contactEmail: "" },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
