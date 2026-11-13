/* Service worker: makes the portfolio installable and usable offline.
   Pages: network first (always fresh when online), cached copy when offline.
   Files (CSS, JS, images, resume): served from cache and refreshed in the background.
   Bump VERSION whenever the precached files change. */
const VERSION = "nr-2026-11-13c";
const CACHE = `narasimha-${VERSION}`;
const PRECACHE = [
  "/",
  "/resume",
  "/resume.html",
  "/manifest.webmanifest",
  "/assets/css/styles.css?v=3",
  "/assets/js/main.js?v=3",
  "/assets/img/favicon.svg",
  "/assets/img/icons/icon-192.png",
  "/assets/img/icons/icon-512.png",
  "/assets/img/narasimha-portrait.webp",
  "/assets/img/narasimha-portrait-480.webp",
  "/assets/img/narasimha-full.webp",
  "/assets/img/resume-preview.webp",
  "/assets/files/Narasimha_Reddy_MC_Resume.pdf",
  "/assets/files/Narasimha_Reddy_MC_Resume.docx",
];

// Only keep clean, same-origin (or CORS) 200 responses. Redirected responses
// (e.g. Vercel's /resume.html -> /resume) must never be replayed for navigations.
const cacheable = (res) => res && res.ok && !res.redirected && (res.type === "basic" || res.type === "cors");

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all(PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: "reload" });
        if (cacheable(res)) await cache.put(url, res);
      } catch { /* offline during install or path not on this host: skip */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("narasimha-") && k !== CACHE).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) await self.registration.navigationPreload.enable();
    await self.clients.claim();
  })());
});

async function pageResponse(event) {
  const cache = await caches.open(CACHE);
  try {
    const preload = await event.preloadResponse;
    const res = preload || await fetch(event.request);
    if (cacheable(res)) cache.put(new URL(event.request.url).pathname, res.clone());
    return res;
  } catch {
    const path = new URL(event.request.url).pathname;
    return (await cache.match(path)) ||
      (path.startsWith("/resume") && ((await cache.match("/resume")) || (await cache.match("/resume.html")))) ||
      (await cache.match("/")) ||
      new Response("<h1>You are offline</h1><p>Please reconnect and try again.</p>", { headers: { "Content-Type": "text/html; charset=utf-8" } });
  }
}

async function assetResponse(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then((res) => {
    if (cacheable(res) || (res && res.type === "opaque")) cache.put(request, res.clone());
    return res;
  }).catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (request.mode === "navigate" && url.origin === self.location.origin) {
    event.respondWith(pageResponse(event));
    return;
  }
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (url.origin === self.location.origin || isFont) {
    event.respondWith(assetResponse(request));
  }
});
