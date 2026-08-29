import { anonymizeIp } from "./privacy.js";

// Sehr einfaches, Mongo-gestütztes Rate-Limit (kein In-Memory-Zähler, weil
// Serverless-Funktionen keinen zuverlässig gemeinsamen Prozessspeicher haben).
// IP wird bereits gekürzt gespeichert (siehe privacy.js) – das Limit greift
// also pro /24-Subnetz, nicht pro exakter Adresse. Das ist bewusst so:
// Datensparsamkeit geht hier vor Präzision.
export async function checkRateLimit(db, { ip, route, max = 5, windowMs = 10 * 60 * 1000 }) {
  const key = `${route}:${anonymizeIp(ip)}`;
  const now = Date.now();
  const windowStart = now - windowMs;

  const col = db.collection("rateLimits");
  await col.deleteMany({ key, timestamp: { $lt: windowStart } });
  const count = await col.countDocuments({ key, timestamp: { $gte: windowStart } });
  if (count >= max) return false;

  await col.insertOne({ key, timestamp: now, expiresAt: new Date(now + windowMs) });
  return true;
}
