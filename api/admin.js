import { getDb } from "./lib/db.js";
import { requireRole } from "./lib/session.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const session = requireRole(req, ["admin"]);
  if (!session) return res.status(403).json({ error: "Nicht autorisiert" });

  const db = await getDb();

  try {
    const { action, payload } = req.body || {};

    if (action === "save_news") {
      await db.collection("news").insertOne({ ...payload, timestamp: Date.now() });
      return res.status(200).json({ success: true });
    }

    if (action === "save_settings") {
      await db.collection("settings").updateOne({ id: "general" }, { $set: payload }, { upsert: true });
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: "Unbekannte Aktion" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
