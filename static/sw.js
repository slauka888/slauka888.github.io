const CACHE_VERSION = "__KACHER_CACHE_VERSION__";
const CACHE_NAME = `kacher-public-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/static/site.css",
  "/static/site.js",
  "/static/brand/kacher-32.png",
  "/static/brand/kacher-180.png",
  "/static/brand/kacher-512.png",
  "/static/brand/kacher-mark.png",
  "/static/brand/kacher-app-icon.png",
  "/static/fonts/Inter-Variable.ttf",
  "/static/fonts/SpaceGrotesk-Variable.ttf",
  "/static/fonts/JetBrainsMono-Variable.ttf",
];

const PRIVATE_PREFIXES = [
  "/account",
  "/admin",
  "/auth",
  "/billing/",
  "/devices",
  "/entitlements",
  "/events",
  "/usage",
  "/v2/",
  "/v1/devices",
  "/v1/entitlements",
  "/v1/usage",
  "/v1/billing/checkout",
  "/v1/billing/payment",
  "/v1/billing/webhook",
];

const isPrivateUrl = url => PRIVATE_PREFIXES.some(prefix => url.pathname.startsWith(prefix));
const isStaticUrl = url => url.pathname.startsWith("/static/");

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS.map(url => new Request(url, { cache: "reload" })))).catch(() => undefined),
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith("kacher-public-") && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window" }))
      .then(clients => clients.forEach(client => client.postMessage({ type: "KACHER_SW_UPDATED", version: CACHE_VERSION }))),
  );
});

self.addEventListener("message", event => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isPrivateUrl(url)) return;

  if (isStaticUrl(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (request.headers.get("accept")?.includes("text/html") || url.pathname === "/v1/billing/prices") {
    event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}
