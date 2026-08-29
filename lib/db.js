import { MongoClient } from "mongodb";

let cachedClient = null;
let cachedDb = null;

// Wiederverwendet die Verbindung über mehrere Serverless-Aufrufe hinweg
// (Vercel friert den Prozess zwischen Aufrufen oft ein, statt ihn neu zu starten).
export async function getDb() {
  if (cachedDb) return cachedDb;
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI ist nicht gesetzt.");
  }
  cachedClient = cachedClient || new MongoClient(process.env.MONGODB_URI);
  if (!cachedClient.topology || !cachedClient.topology.isConnected()) {
    await cachedClient.connect();
  }
  cachedDb = cachedClient.db(process.env.MONGODB_DB || "minis_db");
  return cachedDb;
}

let indexesEnsured = false;

// Best-effort: einmalig TTL-Indizes anlegen. Schlägt lautlos fehl, wenn sie
// schon existieren oder die Rechte fehlen – kein Grund, eine Anfrage platzen zu lassen.
export async function ensureIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await db.collection("antraege").createIndex(
      { createdAt: 1 },
      { expireAfterSeconds: 60 * 60 * 24 * 30, partialFilterExpression: { status: "ausstehend" } }
    );
  } catch (e) {
    // ignorieren – Index existiert vermutlich schon
  }
  try {
    await db.collection("rateLimits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  } catch (e) {
    // ignorieren
  }
}
