// Service worker minimal: cache-first for static assets, network-first for navigation.
const CACHE_NAME = "rms-v2"
const STATIC_ASSETS = ["/manifest.json"]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(STATIC_ASSETS)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET" || !request.url.startsWith("http")) return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone()
          caches.open(CACHE_NAME).then((c) => c.put(request, copy))
          return resp
        })
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/dashboard")))
    )
    return
  }

  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((resp) => {
          if (resp.ok && request.url.includes(self.location.origin)) {
            const copy = resp.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, copy))
          }
          return resp
        })
    )
  )
})