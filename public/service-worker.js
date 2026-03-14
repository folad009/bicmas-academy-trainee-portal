const CACHE_NAME = "bicmas-app-v2";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  // HTML requests: always try network first
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static assets: cache first
  event.respondWith(
  caches.match(request).then((cached) => {
    return (
      cached ||
      fetch(request).then((response) => {
        if (!response.ok || response.type === "opaque") {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
    );
  })
);
});