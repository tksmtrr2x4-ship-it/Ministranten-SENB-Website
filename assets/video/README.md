# Begrüßungs-Animation – noch zu erzeugen

Diese beiden Dateien fehlen noch und müssen mit Higgsfield erzeugt und hier abgelegt werden:

- `willkommen.webm` (VP9, Ziel unter 2 MB)
- `willkommen.mp4` (H.264, Safari-Fallback, Ziel unter 2 MB)

Bis dahin zeigt die Startseite nur das Platzhalter-Standbild
`/assets/img/willkommen-poster.jpg` (eine schlichte Kreuz-Ornament-Grafik,
keine reale Person) – das `<video>`-Element fällt automatisch darauf zurück,
wenn die Quellen fehlen.

## 1. Standbild (Bildgenerierung)

```
Warm hand-illustrated children's book style, gouache texture, soft edges.
A small altar server, around nine years old, friendly and cheerful, wearing a
deep red cassock and a white lace-trimmed surplice. He holds a brass thurible
on three chains in his right hand, slightly raised. His left hand is lifted in
a small welcoming wave. Standing in a quiet stone church nave, warm golden
light falling from a stained glass window, thin wisps of incense smoke.
Muted palette: deep navy blue, antique gold, cream, muted red.
Full body, centered composition, plain cream background with soft vignette,
generous empty space on the left. No text, no lettering, no logos.
```

## 2. Animation (Image-to-Video)

```
The altar server slowly swings the thurible back and forth in a gentle arc,
chains moving naturally with slight delay. A thin ribbon of incense smoke rises
and curls upward, drifting to the right. His surplice sways softly. He raises
his left hand in a small welcoming wave, then smiles toward the viewer.
Camera completely static, no zoom, no pan, no parallax.
Calm, slow, dignified motion. Seamless loop, 4 seconds.
```

Einstellungen: 16:9, statische Kamera, niedrigste sinnvolle Bewegungsstärke.
Mehrere Durchläufe erzeugen, den mit dem saubersten Schleifenübergang wählen.

## 3. Nach dem Export

1. Ergebnis herunterladen (nicht als Higgsfield-URL einbetten – das würde
   IP-Adressen der Besucher an einen Drittanbieter senden).
2. Als `willkommen.webm` und `willkommen.mp4` in diesen Ordner legen.
3. Ein neues Standbild (erster Frame) als `willkommen-poster.jpg` unter
   `/assets/img/` ablegen (unter 80 KB, WebP ist auch möglich – dann Pfad in
   `index.html` anpassen).
4. In `/impressum` unter „Bildnachweis“ steht bereits, dass die Figur
   KI-generiert ist – nichts weiter zu tun.
