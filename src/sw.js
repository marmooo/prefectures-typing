const cacheName = "2026-04-20 00:00";
const urlsToCache = [
  "/prefectures-typing/index.js",
  "/prefectures-typing/problems.csv",
  "/prefectures-typing/mp3/bgm.mp3",
  "/prefectures-typing/mp3/cat.mp3",
  "/prefectures-typing/mp3/correct.mp3",
  "/prefectures-typing/mp3/end.mp3",
  "/prefectures-typing/mp3/keyboard.mp3",
  "/prefectures-typing/favicon/favicon.svg",
  "https://marmooo.github.io/fonts/textar-light.woff2",
];

async function preCache() {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urlsToCache.map((url) =>
      cache.add(url).catch((err) => console.warn("Failed to cache", url, err))
    ),
  );
  self.skipWaiting();
}

async function handleFetch(event) {
  const cached = await caches.match(event.request);
  return cached || fetch(event.request);
}

async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames.map((name) => name !== cacheName ? caches.delete(name) : null),
  );
  self.clients.claim();
}

self.addEventListener("install", (event) => {
  event.waitUntil(preCache());
});
self.addEventListener("fetch", (event) => {
  event.respondWith(handleFetch(event));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(cleanOldCaches());
});
