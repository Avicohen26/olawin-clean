// Olawin — Service Worker (PWA)
// Strategie prudente : "network-first" pour que le site affiche TOUJOURS
// la derniere version en priorite. Le cache ne sert QUE de secours hors-ligne.
// On ne touche JAMAIS aux appels API, Firebase, Stripe ou aux domaines externes.

const CACHE = "olawin-v1";

// Installation : on prend la main immediatement.
self.addEventListener("install", function (e) {
  self.skipWaiting();
});

// Activation : on nettoie les anciens caches et on prend le controle des pages.
self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.map(function (k) {
          if (k !== CACHE) return caches.delete(k);
        })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (e) {
  const req = e.request;

  // On ne gere QUE les GET.
  if (req.method !== "GET") return;

  let url;
  try {
    url = new URL(req.url);
  } catch (err) {
    return;
  }

  // On ignore tout ce qui n'est pas notre propre domaine
  // (Firebase, Stripe, images weserv, Google, etc. gerent leur propre reseau).
  if (url.origin !== self.location.origin) return;

  // Securite : on ne met jamais en cache les appels serveur.
  if (url.pathname.indexOf("/api/") === 0) return;

  // Network-first : on tente le reseau, on met a jour le cache,
  // et on ne retombe sur le cache qu'en cas d'echec (hors-ligne).
  e.respondWith(
    fetch(req)
      .then(function (resp) {
        // On ne met en cache que les reponses valides et "basic" (meme origine).
        if (resp && resp.status === 200 && resp.type === "basic") {
          const copy = resp.clone();
          caches.open(CACHE).then(function (c) {
            c.put(req, copy);
          });
        }
        return resp;
      })
      .catch(function () {
        // Hors-ligne : on essaie le cache, sinon la page d'accueil.
        return caches.match(req).then(function (hit) {
          return hit || caches.match("/index.html") || caches.match("/");
        });
      })
  );
});
