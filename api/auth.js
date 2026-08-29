import { verifyPassword } from "../lib/password.js";
import { setSessionCookie, clearSessionCookie } from "../lib/session.js";
import { getDb, ensureIndexes } from "../lib/db.js";
import { getClientIp } from "../lib/privacy.js";
import { checkRateLimit } from "../lib/rateLimit.js";

// Zugangsdaten kommen ausschließlich aus Umgebungsvariablen, kein
// Klartext-Fallback im Code. ADMIN_PASSWORD_HASH wird einmalig mit
// node -e "import('./lib/password.js').then(m => console.log(m.hashPassword('...')))"
// (im Projekt-Wurzelverzeichnis ausgeführt) erzeugt, siehe README.md.
export default async function handler(req, res) {
  if (req.method === "DELETE") {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  }

  if (req.method !== "POST") return res.status(405).end();

  const db = await getDb();
  await ensureIndexes(db);
  const erlaubt = await checkRateLimit(db, { ip: getClientIp(req), route: "auth", max: 10, windowMs: 10 * 60 * 1000 });
  if (!erlaubt) return res.status(429).json({ error: "Zu viele Versuche, bitte später erneut probieren." });

  const { username, password } = req.body || {};
  const adminUser = process.env.ADMIN_USER;
  const adminHash = process.env.ADMIN_PASSWORD_HASH;

  if (!adminUser || !adminHash) {
    return res.status(500).json({ error: "Interner Bereich ist noch nicht eingerichtet (fehlende Umgebungsvariablen)." });
  }

  if (username === adminUser && verifyPassword(password || "", adminHash)) {
    setSessionCookie(res, { role: "admin", username });
    return res.status(200).json({ success: true });
  }

  return res.status(401).json({ error: "Falsche Zugangsdaten" });
}
