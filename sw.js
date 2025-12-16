// sw.js — FORCE UPDATE + CLEAR OLD CACHES (best for debugging on GitHub Pages)

const VERSION = "v2025-12-15-01"; // <-- change this every time you deploy
const CACHE_ALLOWLIST = new Set([`flipcity-${VERSION}`]);

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (CACHE_ALLOWLIST.has(k) ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

// IMPORTANT: do NOT cache HTML or JS while you're debugging.
// Let the network always win for navigations + scripts.
self.addEventListener("fetch", (event) => {
  const req = event.request;

  const isNav = req.mode === "navigate";
  const isScript = req.destination === "script";

  if (isNav || isScript) return; // network by default

  event.respondWith(fetch(req));
});
