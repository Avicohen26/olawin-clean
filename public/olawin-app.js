/* Olawin — App & notifications (script autonome, charge depuis index.html)
   - Bouton discret "Installer l'app" (Android = auto, iPhone = guide 2 etapes)
   - Activation des notifications push
   - Comptage installations / ouvertures de l'app
   Ne touche PAS a l'application React : tout est independant.
*/
(function () {
  "use strict";
  var GOLD = "#B08D57", DARK = "#1A1A1A", CREAM = "#F5F1EA";
  var isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  var isMobile = isIOS || /Android/i.test(navigator.userAgent);
  var isStandalone = (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;

  function track(type) {
    try {
      fetch("/api/push?action=track", { method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true, body: JSON.stringify({ type: type }) }).catch(function () {});
    } catch (e) {}
  }
  // Ouverture de l'app installee (1 fois par session)
  if (isStandalone) {
    // Premiere ouverture depuis l'ecran d'accueil = installation (fiable aussi sur iPhone,
    // ou l'evenement "appinstalled" n'existe pas). Compte une seule fois par appareil.
    try { if (!localStorage.getItem("ola_installed")) { localStorage.setItem("ola_installed", "1"); track("install"); } } catch (e) {}
    try { if (!sessionStorage.getItem("ola_open")) { sessionStorage.setItem("ola_open", "1"); track("open"); } } catch (e) { track("open"); }
  }
window.addEventListener("appinstalled", function () { try { if (!localStorage.getItem("ola_installed")) { localStorage.setItem("ola_installed", "1"); track("install"); } } catch (e) { track("install"); } hideBar(); });

  // ---------- Push ----------
  function urlB64ToUint8Array(b) {
    var pad = "=".repeat((4 - (b.length % 4)) % 4);
    var s = (b + pad).replace(/-/g, "+").replace(/_/g, "/");
    var raw = atob(s), arr = new Uint8Array(raw.length);
    for (var i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }
  function pushSupported() {
    return ("serviceWorker" in navigator) && ("PushManager" in window) && ("Notification" in window);
  }
  async function enableNotifications() {
    if (!pushSupported()) return false;
    try {
      var perm = await Notification.requestPermission();
      if (perm !== "granted") return false;
      var reg = await navigator.serviceWorker.ready;
      var sub = await reg.pushManager.getSubscription();
      if (!sub) {
        var kr = await (await fetch("/api/push?action=key")).json();
        if (!kr.publicKey) return false;
        sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8Array(kr.publicKey) });
      }
      var lang = "";
      try { lang = (document.documentElement.lang || navigator.language || "").slice(0, 2); } catch (e) {}
      await fetch("/api/push?action=save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub, lang: lang }) });
      try { localStorage.setItem("ola_push", "1"); } catch (e) {}
      return true;
    } catch (e) { return false; }
  }
  window.olawinEnableNotifications = enableNotifications;

  // ---------- UI ----------
  var deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferredPrompt = e; showBar("install"); });

  var bar = null;
  function hideBar() { if (bar) { bar.style.display = "none"; } }
  function dismissed() { try { return localStorage.getItem("ola_bar_off") === "1"; } catch (e) { return false; } }
  function setDismissed() { try { localStorage.setItem("ola_bar_off", "1"); } catch (e) {} }

  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt != null) e.textContent = txt; return e; }

  function showBar(mode) {
    if (!isMobile || dismissed()) return;
    if (bar) { bar.style.display = "flex"; return; }
    bar = el("div", "position:fixed;left:12px;right:12px;bottom:14px;z-index:99998;background:" + DARK + ";color:" + CREAM + ";border:1px solid rgba(176,141,87,.5);border-radius:16px;padding:11px 12px;display:flex;align-items:center;gap:10px;box-shadow:0 10px 30px rgba(0,0,0,.35);font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;");
    var ic = el("div", "width:38px;height:38px;flex:0 0 auto;border-radius:9px;background:" + DARK + ";border:1px solid rgba(176,141,87,.5);display:flex;align-items:center;justify-content:center;font-size:18px;", "📲");
    var tx = el("div", "flex:1;min-width:0;");
    var t1 = el("div", "font-size:13px;font-weight:700;color:" + CREAM + ";");
    var t2 = el("div", "font-size:10.5px;color:#9a938b;margin-top:1px;");
    tx.appendChild(t1); tx.appendChild(t2);
    var go = el("button", "background:" + GOLD + ";color:" + DARK + ";font-weight:800;font-size:12px;border:none;padding:9px 15px;border-radius:20px;white-space:nowrap;cursor:pointer;");
    var close = el("button", "background:none;border:none;color:#6f6a63;font-size:16px;cursor:pointer;padding:0 2px;", "✕");
    close.onclick = function () { setDismissed(); hideBar(); };
    bar.appendChild(ic); bar.appendChild(tx); bar.appendChild(go); bar.appendChild(close);
    document.body.appendChild(bar);

    if (mode === "notif") {
      ic.textContent = "🔔";
      t1.textContent = "Restez informé";
      t2.textContent = "Soyez alerté des nouveaux tirages";
      go.textContent = "Activer";
      go.onclick = function () {
        go.textContent = "…";
        enableNotifications().then(function (ok) { if (ok) { hideBar(); } else { go.textContent = "Activer"; } });
      };
    } else {
      t1.textContent = "Installer l'app Olawin";
      t2.textContent = isIOS ? "Ajoutez-la à votre écran d'accueil" : "Accès rapide depuis l'écran d'accueil";
      go.textContent = "Installer";
      go.onclick = function () {
        if (isIOS) { showIOSGuide(); return; }
        if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt.userChoice.then(function () { deferredPrompt = null; hideBar(); }); }
        else { showIOSGuide(); }
      };
    }
  }

  function showIOSGuide() {
    var ov = el("div", "position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,.55);display:flex;align-items:flex-end;justify-content:center;padding:0 0 90px;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;");
    var card = el("div", "background:" + DARK + ";color:" + CREAM + ";border:1px solid rgba(176,141,87,.5);border-radius:18px;padding:18px;width:88%;max-width:360px;box-shadow:0 16px 40px rgba(0,0,0,.5);");
    var h = el("div", "font-size:15px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:8px;", "📲 Installer Olawin");
    var s1 = el("div", "display:flex;align-items:center;gap:10px;padding:10px 0;font-size:13.5px;border-bottom:1px solid rgba(255,255,255,.08);");
    s1.innerHTML = '<span style="width:22px;height:22px;border-radius:50%;background:' + GOLD + ';color:' + DARK + ';font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">1</span> Appuyez sur <b style="color:#c9a875;margin:0 3px;">Partager</b> en bas de Safari';
    var s2 = el("div", "display:flex;align-items:center;gap:10px;padding:10px 0;font-size:13.5px;");
    s2.innerHTML = '<span style="width:22px;height:22px;border-radius:50%;background:' + GOLD + ';color:' + DARK + ';font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;">2</span> Puis <b style="color:#c9a875;margin:0 3px;">« Sur l\'écran d\'accueil »</b>';
    var ok = el("button", "margin-top:14px;width:100%;background:" + GOLD + ";color:" + DARK + ";font-weight:800;border:none;padding:12px;border-radius:22px;cursor:pointer;", "J'ai compris");
    ok.onclick = function () { document.body.removeChild(ov); };
    card.appendChild(h); card.appendChild(s1); card.appendChild(s2); card.appendChild(ok);
    ov.appendChild(card); ov.onclick = function (e) { if (e.target === ov) document.body.removeChild(ov); };
    document.body.appendChild(ov);
  }

  // Decide quelle barre montrer, apres chargement.
  function init() {
    var pushOn = false;
    try { pushOn = localStorage.getItem("ola_push") === "1"; } catch (e) {}
    if (isStandalone) {
      // App installee : proposer les notifications si pas encore actives.
      if (!pushOn && pushSupported()) {
        try {
          navigator.serviceWorker.ready.then(function (reg) {
            reg.pushManager.getSubscription().then(function (sub) {
              if (!sub && Notification.permission !== "denied") { setTimeout(function () { showBar("notif"); }, 1500); }
            });
          });
        } catch (e) {}
      }
    } else if (isMobile) {
      // Pas installee : proposer l'installation (Android affichera aussi son invite native).
      setTimeout(function () { if (!bar) showBar("install"); }, 2500);
    }
  }
  if (document.readyState === "complete") init();
  else window.addEventListener("load", init);
})();
