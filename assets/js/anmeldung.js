// Progressive Enhancement für das Anmeldeformular.
// WICHTIG: Das Formular sendet mit einem normalen POST an /api/register und
// funktioniert vollständig ohne dieses Skript. Alles hier verbessert nur die
// Bedienung; die eigentliche fachliche Prüfung (KJS-Kopplung, Minderjährigkeit)
// passiert serverseitig in api/register.js, egal was hier im Browser passiert.
(function () {
  var form = document.getElementById("antrag-form");
  if (!form) return;

  var artRadios = form.querySelectorAll('input[name="antragsart"]');
  var kjsCheckbox = document.getElementById("f-kjs");
  var kjsHint = document.getElementById("kjs-hint");
  var geburtsdatum = document.getElementById("f-geburtsdatum");
  var minderjaehrigBlock = document.getElementById("block-sorgeberechtigt");
  var volljaehrigBlock = document.getElementById("block-eigenkontakt");
  var minderjaehrigHint = document.getElementById("minderjaehrig-hint");

  function heuteJahreDifferenz(datumStr) {
    if (!datumStr) return null;
    var geb = new Date(datumStr);
    if (isNaN(geb.getTime())) return null;
    var heute = new Date();
    var alter = heute.getFullYear() - geb.getFullYear();
    var m = heute.getMonth() - geb.getMonth();
    if (m < 0 || (m === 0 && heute.getDate() < geb.getDate())) alter--;
    return alter;
  }

  function updateKjsState() {
    var gewaehlt = form.querySelector('input[name="antragsart"]:checked');
    var wert = gewaehlt ? gewaehlt.value : null;
    if (wert === "mini" || wert === "beides") {
      kjsCheckbox.checked = true;
      kjsCheckbox.disabled = true;
      kjsHint.textContent = "Als Mini bist du automatisch auch in der KJS dabei.";
    } else {
      kjsCheckbox.disabled = false;
      kjsHint.textContent = "Freiwillig – unabhängig von einer Mini-Anmeldung.";
    }
  }

  function updateAgeBlocks() {
    var alter = heuteJahreDifferenz(geburtsdatum.value);
    if (alter === null) {
      minderjaehrigHint.textContent = "Bitte gib dein Geburtsdatum an, damit wir wissen, welcher Kontakt benötigt wird.";
      return;
    }
    if (alter < 18) {
      minderjaehrigBlock.hidden = false;
      volljaehrigBlock.hidden = true;
      minderjaehrigHint.textContent = "Du bist laut Geburtsdatum aktuell minderjährig – bitte trage die Kontaktdaten einer sorgeberechtigten Person ein.";
    } else {
      minderjaehrigBlock.hidden = true;
      volljaehrigBlock.hidden = false;
      minderjaehrigHint.textContent = "Du bist laut Geburtsdatum aktuell volljährig – bitte trage deinen eigenen Kontakt ein.";
    }
  }

  artRadios.forEach(function (r) {
    r.addEventListener("change", updateKjsState);
  });
  geburtsdatum.addEventListener("input", updateAgeBlocks);
  geburtsdatum.addEventListener("change", updateAgeBlocks);

  updateKjsState();
  updateAgeBlocks();
  // Der loadedAt-Zeitstempel für die Spam-Prüfung wird zentral von site.js gesetzt.
})();
