// Sehr sparsame Progressive Enhancement: Mobile-Navigation.
// Die Seite ist ohne dieses Skript vollständig lesbar und nutzbar,
// die Navigation ist auf kleinen Bildschirmen dann dauerhaft ausgeklappt.
(function () {
  var toggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  }

  // Zeitstempel für die serverseitige Spam-Prüfung auf allen Formularen
  // (Absenden unter 3 Sekunden nach dem Laden wird verworfen, siehe /api).
  document.querySelectorAll('input[name="loadedAt"]').forEach(function (el) {
    el.value = Date.now().toString();
  });

  // prefers-reduced-motion muss das Begrüßungsvideo VOLLSTÄNDIG unterdrücken,
  // nicht nur CSS-Übergänge. Ohne dieses Skript (kein JS) spielt das Video
  // wie gewohnt – das ist hier hinnehmbar, weil nur die Kernfunktion
  // Anmeldung ausdrücklich ohne JavaScript funktionieren muss.
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    document.querySelectorAll("video[autoplay]").forEach(function (video) {
      video.pause();
      video.removeAttribute("autoplay");
      video.querySelectorAll("source").forEach(function (source) {
        source.removeAttribute("src");
      });
      video.load();
    });
  }
})();
