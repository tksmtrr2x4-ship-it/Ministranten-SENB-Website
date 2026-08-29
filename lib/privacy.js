// IP-Adressen serverseitig nur gekürzt verwenden/protokollieren (letztes Oktett
// bzw. bei IPv6 die letzten Gruppen verwerfen) – siehe /datenschutz Abschnitt 10.
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  const raw = (Array.isArray(forwarded) ? forwarded[0] : forwarded || "")
    .split(",")[0]
    .trim();
  return raw || req.socket?.remoteAddress || "0.0.0.0";
}

export function anonymizeIp(ip) {
  if (!ip) return "0.0.0.0";
  if (ip.includes(":")) {
    const parts = ip.split(":");
    return parts.slice(0, 4).concat(["0", "0", "0", "0"]).slice(0, 8).join(":");
  }
  const parts = ip.split(".");
  if (parts.length !== 4) return "0.0.0.0";
  parts[3] = "0";
  return parts.join(".");
}
