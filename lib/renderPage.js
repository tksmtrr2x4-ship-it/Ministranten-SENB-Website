// Minimaler, im Design passender HTML-Renderer für serverseitige Antworten
// (Validierungsfehler, 403, 429). Kein Templating-Framework nötig – die Seite
// ist bewusst schlicht statisch, das gilt auch für ihre wenigen dynamischen
// Antworten.
export function renderMessagePage({ title, heading, message, backHref = "/", backLabel = "Zurück", status = 200 }) {
  const html = `<!doctype html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} – Ministranten &amp; KJS Neckar-Baar</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
<header class="site-header">
  <div class="site-header__brand">
    <span class="site-header__logo" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v18M6.5 8.5h11" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" fill="none"/></svg></span>
    <h1 class="site-header__title">Ministranten &amp; KJS<small>Seelsorgeeinheit Neckar-Baar</small></h1>
  </div>
</header>
<main id="main">
  <section>
    <div class="wrap prose text-center">
      <h2>${escapeHtml(heading)}</h2>
      <p>${message}</p>
      <p><a class="text-link" href="${escapeHtml(backHref)}">${escapeHtml(backLabel)}</a></p>
    </div>
  </section>
</main>
</body>
</html>`;
  return { status, html };
}

export function sendMessagePage(res, opts) {
  const { status, html } = renderMessagePage(opts);
  res.status(status).setHeader("Content-Type", "text/html; charset=utf-8").send(html);
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}
