// Redaktions-Dashboard: News veröffentlichen, Kontakt-E-Mail einstellen.
// Auth läuft über das httpOnly-Session-Cookie, siehe assets/js/intern.js.
(function () {
  var statusBox = document.getElementById("dashboard-status");

  function showStatus(text, ok) {
    statusBox.textContent = text;
    statusBox.hidden = false;
    statusBox.className = ok ? "notice notice--success" : "notice notice--error";
  }

  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (event) {
        var img = new Image();
        img.onload = function () {
          var canvas = document.createElement("canvas");
          var maxWidth = 800;
          var scale = Math.min(1, maxWidth / img.width);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.7));
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function callAdmin(action, payload) {
    var res = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ action: action, payload: payload }),
    });
    if (res.status === 401 || res.status === 403) {
      window.location.href = "/intern/";
      throw new Error("nicht angemeldet");
    }
    if (!res.ok) throw new Error("Serverfehler");
    return res.json();
  }

  var newsForm = document.getElementById("news-form");
  if (newsForm) {
    newsForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var title = document.getElementById("news-title").value;
      var text = document.getElementById("news-text").value;
      var file = document.getElementById("news-img").files[0];
      var image = file ? await compressImage(file) : null;
      try {
        await callAdmin("save_news", { title: title, text: text, image: image });
        showStatus("News veröffentlicht.", true);
        newsForm.reset();
      } catch (err) {
        showStatus("Fehler beim Veröffentlichen.", false);
      }
    });
  }

  var settingsForm = document.getElementById("settings-form");
  if (settingsForm) {
    settingsForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      var contactEmail = document.getElementById("set-email").value;
      try {
        await callAdmin("save_settings", { contactEmail: contactEmail });
        showStatus("Einstellungen gespeichert.", true);
      } catch (err) {
        showStatus("Fehler beim Speichern.", false);
      }
    });
  }

  var main = document.querySelector("[data-protected-endpoint]");
  if (main) {
    main.addEventListener("data-loaded", function (e) {
      var data = e.detail;
      if (data && data.settings && data.settings.contactEmail) {
        document.getElementById("set-email").value = data.settings.contactEmail;
      }
    });
  }
})();
