const CACHE = "cityflip-ultra-cache-v6";
const OFFLINE_URL = "./offline.html";

const CORE = [
  "./",
  "./index.html",
  "./game.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== location.origin) return;

  const isHTML =
    req.mode === "navigate" ||
    (req.headers.get("accept") || "").includes("text/html");

  const isGameJS = url.pathname.endsWith("/game.js") || url.pathname.endsWith("game.js");

  // Network-first for HTML so updates always come through
  if (isHTML) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(async () => (await caches.match(req)) || caches.match(OFFLINE_URL))
    );
    return;
  }

  // Network-first for game.js specifically (prevents “stuck loading”)
  if (isGameJS) {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return resp;
        })
        .catch(async () => (await caches.match(req)) || Response.error())
    );
    return;
  }

  // Cache-first for other assets
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return resp;
      });
    })
  );
});

