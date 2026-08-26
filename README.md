# Minis & KJS Neckar-Baar – Website

Statische Vatikan-inspirierte Website + Vercel-Serverless-API (Node, MongoDB,
Nodemailer). Diese Version ersetzt die frühere Glasmorphismus-Single-Page-App
durch echte, adressierbare Seiten und eine tatsächliche Anmeldefunktion
(vorher gab es nur einen PDF-Download-Link). Kroatische Gemeinde ist auf
ausdrücklichen Wunsch überall ausgeklammert.

## Vor dem Go-Live: unbedingt lesen

1. **Impressum & Datenschutz** (`impressum.html`, `datenschutz.html`) müssen von
   der Kirchengemeinde rechtlich geprüft werden. Alle `[Platzhalter]` ausfüllen,
   insbesondere Träger, Anschrift, Vertretung und die genaue Bezeichnung der
   zuständigen diözesanen Datenschutzaufsicht (beim Pfarramt erfragen).
2. **Oberminis-Fotos/Namen** (`oberminis.html`): Aktuell zeigt die Seite für
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
- `/api/*.js` sind Vercel-Serverless-Functions (Node, ESM). MongoDB über
  `api/lib/db.js`, Mailversand über `api/lib/mailer.js`.
- `vercel.json` setzt `cleanUrls` (daher funktionieren Links wie `/ministrieren`
  ohne `.html`), eine strikte Content-Security-Policy ohne `unsafe-inline`
  (deshalb keine Inline-`<script>`/`style="..."` irgendwo im Markup) und den
  täglichen Cron-Job für die Löschfrist.

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
  „Einverständniserklärung“ an (`api/lib/consentPdf.js`, erzeugt mit
  `pdf-lib`, keine externe Vorlage nötig).
- Löschung unbestätigter Anträge nach 30 Tagen: primär über einen
  TTL-Index auf `antraege.createdAt` (`api/lib/db.js`), zusätzlich abgesichert
  durch den täglichen Cron-Job `api/cron/cleanup.js`.
- Spam-Schutz: unsichtbares Honeypot-Feld + Mindestzeit von 3 Sekunden
  zwischen Laden und Absenden + Mongo-gestütztes IP-Rate-Limit
  (`api/lib/rateLimit.js`). Kein reCAPTCHA/hCaptcha.

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
cd api && npm install
vercel dev
```

Umgebungsvariablen wie in `.env.example` beschrieben in Vercel hinterlegen.
MongoDB und SMTP-Anbieter mit Sitz/AV-Vertrag in der EU wählen (siehe
`/datenschutz`).
