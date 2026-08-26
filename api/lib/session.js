import jwt from "jsonwebtoken";

const COOKIE_NAME = "senb_session";

export function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    out[key] = decodeURIComponent(value);
  });
  return out;
}

// Nur technisch notwendiges Session-Cookie im geschützten Bereich, siehe
// /datenschutz Abschnitt 10: Secure, HttpOnly, SameSite=Lax.
export function setSessionCookie(res, payload, maxAgeSeconds = 8 * 60 * 60) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: maxAgeSeconds });
  res.setHeader(
    "Set-Cookie",
    `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Lax`
  );
}

export function clearSessionCookie(res) {
  res.setHeader("Set-Cookie", `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`);
}

export function getSession(req) {
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    return null;
  }
}

// Rollenmodell (siehe Build-Prompt Abschnitt 8): besucher · mini · obermini ·
// ansprechperson · admin. Aktuell nutzt nur "admin" den internen Bereich;
// die anderen Rollen sind für Phase 2 vorgesehen (Dienstplan-Tausch etc.).
export function requireRole(req, allowedRoles) {
  const session = getSession(req);
  if (!session || !allowedRoles.includes(session.role)) return null;
  return session;
}
