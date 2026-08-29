# Minis & KJS Neckar-Baar – Website

Statische Vatikan-inspirierte Website + Vercel-Serverless-API (Node, MongoDB,
Nodemailer). Diese Version ersetzt die frühere Glasmorphismus-Single-Page-App
durch echte, adressierbare Seiten und eine tatsächliche Anmeldefunktion
(vorher gab es nur einen PDF-Download-Link). Kroatische Gemeinde ist auf
ausdrücklichen Wunsch überall ausgeklammert.

## Vor dem Go-Live: unbedingt lesen

1. **Impressum & Datenschutz** (`impressum/index.html`, `datenschutz/index.html`) müssen von
   der Kirchengemeinde rechtlich geprüft werden. Alle `[Platzhalter]` ausfüllen,
   insbesondere Träger, Anschrift, Vertretung und die genaue Bezeichnung der
   zuständigen diözesanen Datenschutzaufsicht (beim Pfarramt erfragen).
2. **Oberminis-Fotos/Namen** (`oberminis/index.html`): Aktuell zeigt die Seite für
   *alle* Personen nur den Vornamen und keine Fotos, weil keine dokumentierten
   Einwilligungen vorliegen. Die vorherige Version zeigte volle Namen und
   echte Fotos ohne erkennbaren Einwilligungsnachweis – das wurde bewusst
   zurückgenommen. Erst nach schriftlicher Einwilligung (bei Minderjährigen:
   Sorgeberechtigte, ab ca. 14 Jahren zusätzlich der/die Jugendliche selbst)
   pro Person auf vollen Namen/Foto umstellen. Siehe Kommentar am Dateianfang.
3. **Begrüßungs-Video fehlt noch** – siehe `assets/video/README.md` für die
   fertigen Higgsfield-Prompts. Bis dahin läuft die Seite mit einem
   Platzhalter-Standbild statt der animierten Illustration.
4. **Logo fehlt noch** – Kopfbereich zeigt aktuell ein generisches
   Kreuz-Monogramm. Sobald eine echte Logodatei vorliegt, `index.html` &
   Co. (`.site-header__logo`) sowie die Favicons in `assets/img/` ersetzen.
5. **Alle Umgebungsvariablen setzen**, siehe `.env.example`. Ohne sie
   funktionieren weder Anmeldung noch Login.

## Architektur

- Reines statisches HTML/CSS + ein bisschen Vanilla-JS (progressive
  enhancement), keine Frameworks, keine Build-Schritte nötig.
- Schriften (EB Garamond, Source Serif 4, Inter) liegen selbst gehostet unter
  `assets/fonts/`, keine Google-Fonts-Einbindung im Browser.
- `/api/*.js` sind Vercel-Serverless-Functions (Node, ESM) – 8 Stück
  (`admin`, `auth`, `confirm`, `contact`, `cron/cleanup`, `plaene`, `public`,
  `register`). **Wichtig: gemeinsam genutzter Code liegt bewusst in `/lib`
  außerhalb von `/api`, nicht in `api/lib/`.** Vercel macht aus JEDER `.js`-Datei
  unter `/api` eine eigene Funktion – lägen die 9 Hilfsdateien (db, mailer,
  session, …) dort mit drin, wären es 17 „Funktionen“ statt 8, was auf dem
  Hobby-Plan (Limit: 12) den Deploy mit „No more than 12 Serverless Functions“
  blockiert. `package.json`/`node_modules` liegen dafür im Projekt-Wurzel-
  verzeichnis (nicht mehr unter `api/`), damit Node-Module-Auflösung von
  `/lib` aus funktioniert. MongoDB über `lib/db.js`, Mailversand über
  `lib/mailer.js`.
- Jede Seite liegt als eigener Ordner mit `index.html` (z. B. `ministrieren/index.html`),
  genau wie schon vorher `anmeldung/`. Links zeigen entsprechend auf
  `/ministrieren/` mit Slash. Das funktioniert auf jedem Static Host ohne
  Sonderkonfiguration – anders als flache `ministrieren.html`-Dateien mit
  Link auf `/ministrieren` (ohne `.html`), die nur mit Vercels `cleanUrls`
  funktionieren und z. B. bei `python -m http.server` oder falschem
  Vercel-Projekt-Root mit 404 fehlschlagen. Genau das war der Bug, den wir
  gefixt haben – siehe Git-Historie.
- `vercel.json` setzt zusätzlich `cleanUrls`/`trailingSlash: true` als Bonus
  (fängt z. B. `/ministrieren` ohne Slash ab), eine strikte
  Content-Security-Policy ohne `unsafe-inline` (deshalb keine
  Inline-`<script>`/`style="..."` irgendwo im Markup) und den täglichen
  Cron-Job für die Löschfrist.

## Die Anmeldung (Kernfunktion)

- `anmeldung/index.html` postet klassisch (`method="POST"`, kein `fetch`) an
  `/api/register.js` – funktioniert vollständig ohne JavaScript. JavaScript
  (`assets/js/anmeldung.js`) verbessert nur die Bedienung: KJS-Haken wird bei
  „Mini“/„Beides“ automatisch gesetzt+deaktiviert, und je nach Geburtsdatum
  wird der passende Kontakt-Block ein-/ausgeblendet. **Ohne JavaScript sind
  beide Kontakt-Blöcke sichtbar** – die serverseitige Prüfung in
  `api/register.js` entscheidet anhand des Geburtsdatums, welcher Block
  Pflicht ist, unabhängig davon, was im Browser sichtbar war.
- Double-Opt-In: `/api/register.js` speichert den Antrag mit
  `status: "ausstehend"`, verschickt eine Bestätigungsmail mit Link zu
  `/api/confirm.js`. Erst der Klick darauf setzt `status: "bestaetigt"` **und
  benachrichtigt erst dann** die Ansprechperson der Gemeinde – bewusst nicht
  schon beim reinen Absenden, weil die E-Mail-Adresse zu diesem Zeitpunkt noch
  unbestätigt (ggf. vertippt) ist.
- Bei Minderjährigen hängt die Bestätigungsmail automatisch ein PDF
  „Einverständniserklärung“ an (`lib/consentPdf.js`, erzeugt mit
  `pdf-lib`, keine externe Vorlage nötig).
- Löschung unbestätigter Anträge nach 30 Tagen: primär über einen
  TTL-Index auf `antraege.createdAt` (`lib/db.js`), zusätzlich abgesichert
  durch den täglichen Cron-Job `api/cron/cleanup.js`.
- Spam-Schutz: unsichtbares Honeypot-Feld + Mindestzeit von 3 Sekunden
  zwischen Laden und Absenden + Mongo-gestütztes IP-Rate-Limit
  (`lib/rateLimit.js`). Kein reCAPTCHA/hCaptcha.

## Interner Bereich (`/intern`)

Rollenmodell laut Vorgabe: `besucher · mini · obermini · ansprechperson ·
admin`. Umgesetzt ist aktuell nur die Rolle `admin` (Login über
`api/auth.js`, httpOnly-Secure-SameSite=Lax-Session-Cookie statt des
vorherigen `sessionStorage`-Tokens). Die News/Einstellungen-Verwaltung aus
der Vorgängerversion läuft jetzt darüber (`intern/dashboard.html`).

`api/plaene.js` ist das vorbereitete Grundgerüst für das Phase-2-Modul
„Ministrantenpläne“: Route existiert, prüft echte Berechtigung und liefert
**403** (nicht 404) ohne gültige Session. Die eigentliche Oberfläche (PDF-
Upload je Gemeinde) ist bewusst noch nicht gebaut.

## Was aus der Vorgängerversion entfernt wurde

- Tailwind-CDN und Font-Awesome-CDN (Drittanbieter-Requests im Frontend sind
  laut Vorgabe nicht erlaubt) → durch `assets/css/styles.css` ersetzt.
- Der externe Aufruf von `bible-api.com` in `api/public.js`.
- Das fest im Code hinterlegte Ausweich-Passwort `redakteur2026` in
  `api/auth.js`.
- Bearer-Token im `sessionStorage` → httpOnly-Cookie-Session.

## Setup

```bash
npm install
vercel dev
```

Umgebungsvariablen wie in `.env.example` beschrieben in Vercel hinterlegen.
Mailversand ist auf Gmail (`smtp.gmail.com`) voreingestellt – dafür im
verwendeten Gmail-Konto 2FA aktivieren und unter
[myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
ein App-Passwort erzeugen (das normale Passwort funktioniert nicht für SMTP).
Nur `SMTP_USER`/`SMTP_PASS` müssen gesetzt werden, siehe `.env.example`.

MongoDB EU-Region wählen (siehe `/datenschutz`). Zum Hinweis dort: ein
privates Gmail-Konto hat keinen AV-Vertrag nach KDG – nur Google Workspace
bietet einen. Für den echten Betrieb mit Daten von Kindern vorher mit der
Kirchengemeinde klären, ob das ausreicht oder auf Workspace/einen anderen
EU-Anbieter mit AV-Vertrag gewechselt werden soll.
