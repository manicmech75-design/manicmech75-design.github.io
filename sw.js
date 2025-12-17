const CACHE_NAME = "cityflip-cache-v2";

const ASSETS = [
  "/",
  "/index.html",
  "/game.js",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => (key === CACHE_NAME ? null : caches.delete(key)))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // Only same-origin
  if (!req.url.startsWith(self.location.origin)) return;

  // Navigation requests: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put("/index.html", copy)
          );
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Assets: cache-first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req))
  );
});
