// Interner Bereich: Login-Formular + Zugriffsprüfung für geschützte Seiten.
// Die eigentliche Prüfung passiert serverseitig über ein httpOnly-Session-Cookie
// (siehe api/auth.js, api/lib/session.js). Dieses Skript ruft nur Endpunkte auf
// und zeigt Ergebnisse an; es speichert selbst keine Zugangsdaten.
(function () {
  var loginForm = document.getElementById("login-form");
  if (loginForm) {
    var errorBox = document.getElementById("login-error");
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorBox.hidden = true;
      var body = {
        username: document.getElementById("li-user").value,
        password: document.getElementById("li-pass").value,
      };
      try {
        var res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          credentials: "same-origin",
        });
        if (res.ok) {
          window.location.href = "/intern/dashboard.html";
        } else {
          errorBox.textContent = "Benutzername oder Passwort ist falsch.";
          errorBox.hidden = false;
        }
      } catch (err) {
        errorBox.textContent = "Der Server ist gerade nicht erreichbar. Bitte später erneut versuchen.";
        errorBox.hidden = false;
      }
    });
  }

  var protectedRoot = document.querySelector("[data-protected-endpoint]");
  if (protectedRoot) {
    var endpoint = protectedRoot.getAttribute("data-protected-endpoint");
    fetch(endpoint, { credentials: "same-origin" })
      .then(function (res) {
        if (res.status === 403 || res.status === 401) {
          protectedRoot.innerHTML =
            '<div class="notice notice--error">Zugriff verweigert. Bitte melde dich im internen Bereich an, um diese Seite zu sehen.</div>';
          return null;
        }
        return res.json();
      })
      .then(function (data) {
        if (!data) return;
        protectedRoot.dispatchEvent(new CustomEvent("data-loaded", { detail: data }));
      })
      .catch(function () {
        protectedRoot.innerHTML =
          '<div class="notice notice--error">Die Daten konnten nicht geladen werden.</div>';
      });
  }

  var logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (e) {
      e.preventDefault();
      fetch("/api/auth", { method: "DELETE", credentials: "same-origin" }).finally(function () {
        window.location.href = "/intern/";
      });
    });
  }
})();
