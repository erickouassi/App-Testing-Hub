const CACHE_NAME = "app-testing-hub-v1.0.0";
const ASSETS = [
  "/",
  "/index.html",
  "/app.html",
  "/styles.css",
  "/app.js",
  "/app-page.js",
  "/manifest.json",
  "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/android-chrome-192x192.png",
  "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/android-chrome-192x192-maskable.png",
  "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/android-chrome-256x256.png",
  "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/android-chrome-512x512.png",
  "https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/android-chrome-512x512-maskable.png"
];

// 🧩 INSTALL — Cache platform assets & activate immediately
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("📥 [Service Worker] Pre-caching core application assets");
      return cache.addAll(ASSETS);
    })
  );
});

// ⚙️ ACTIVATE — Remove old cache signatures & claim immediate clients control
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log("🧹 [Service Worker] Removing obsolete cache store:", key);
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* -----------------------------------------------------------------------
   🚦 FETCH STRATEGY
   - Network-First with dynamic background cache-updating for Navigations 
     (ensures developers' live closed tracks stay fully up-to-date).
   - Cache-First fallback for static layout resources (CSS, JS, Icons).
----------------------------------------------------------------------- */
self.addEventListener("fetch", event => {
  // Skip cross-origin requests like fetching live feeds from Vercel API or GitHub
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return caches.open(CACHE_NAME).then(cache => {
            // Dynamically save down page structures for instant future offline boots
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          console.log("📡 [Service Worker] Network fallback triggered on navigation loop");
          // If a deep-linked app tracking route (e.g., /app.html?slug=xyz) fails offline,
          // instantly load the offline-ready app shell asset structure gracefully instead
          return caches.match("/app.html") || caches.match("/index.html");
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request);
      })
    );
  }
});

// 🔔 Handle explicit application patch update notifications safely
self.addEventListener("message", event => {
  if (event.data === "checkForUpdate") {
    self.skipWaiting();
  }
});