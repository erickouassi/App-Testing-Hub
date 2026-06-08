const CACHE_NAME = "app-testing-hub-v1.6.7.2026.2";
console.log("Service Worker version:", CACHE_NAME);

/* ---------------------------------------------------------
   📦 ASSETS TO PRE-CACHE (ALL FEATURES INCLUDED)
   - Relative paths only
   - No external URLs
   - Safe for addAll()
--------------------------------------------------------- */
const ASSETS = [
  "index.html",
  "app.html",
  "offline.html",
  "developer-guidelines.html",
  "privacy-policy.html",
  "terms-of-service.html",
  "about.html",
  "styles.css",
  "app.js",
  "app-page.js",
  "manifest.json"
];

// Debug missing assets (non-blocking)
ASSETS.forEach(url => {
  fetch(url)
    .then(r => console.log(url, r.status))
    .catch(() => console.log(url, "FAILED"));
});

/* ---------------------------------------------------------
   🧩 INSTALL — Pre-cache core assets
--------------------------------------------------------- */
self.addEventListener("install", (event) => {
  console.log("📥 [SW] Installing…");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      ASSETS.forEach((url) => {
        fetch(url).catch(() => console.warn("⚠️ Missing asset:", url));
      });

      return cache.addAll(ASSETS);
    })
  );
});

/* ---------------------------------------------------------
   ⚙️ ACTIVATE — Clean old caches
--------------------------------------------------------- */
self.addEventListener("activate", (event) => {
  console.log("🧹 [SW] Activating…");

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log("🗑️ Removing old cache:", key);
            return caches.delete(key);
          })
      )
    )
  );

  self.clients.claim();
});

/* ---------------------------------------------------------
   🚦 FETCH STRATEGY (FULL FEATURE SET)
   - Navigation → network-first
   - Static assets → cache-first
   - Offline fallback → offline.html
   - Dynamic caching for new pages
--------------------------------------------------------- */
self.addEventListener("fetch", (event) => {
  const req = event.request;

  if (!req.url.startsWith(self.location.origin)) return;

  // Navigation requests → network-first
// Navigation requests → network-first
if (req.mode === "navigate") {
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone(); // FIX: clone immediately

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, resClone);
        });

        return res;
      })
      .catch(() => {
        console.log("📡 [SW] Navigation fallback triggered");
        return caches.match("app.html") || caches.match("index.html");
      })
  );
  return;
}


  // Static assets → cache-first
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            // Dynamic caching for new assets
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, res.clone());
            });
            return res;
          })
          .catch(() => {
            if (req.destination === "document") {
              return caches.match("offline.html");
            }
          })
    )
  );
});

/* ---------------------------------------------------------
   🛰️ PUSH NOTIFICATIONS (FULL FEATURE SET)
--------------------------------------------------------- */
self.addEventListener("push", (event) => {
  console.log("📡 [SW] Push received");

  let title = "Testing Hub Update";
  let options = {
    body: "A fellow developer needs testers! Check the active tracks.",
    icon: "img/favicon.svg",
    badge: "img/favicon.svg",
    tag: "hub-push-alert",
    data: { url: "/" },
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options.body = payload.body || options.body;
      if (payload.icon) options.icon = payload.icon;
      if (payload.url) options.data.url = payload.url;
    } catch {
      options.body = event.data.text();
    }
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

/* ---------------------------------------------------------
   👆 NOTIFICATION CLICK HANDLER
--------------------------------------------------------- */
self.addEventListener("notificationclick", (event) => {
  console.log("👆 [SW] Notification clicked");
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (let client of clientsList) {
        if (client.url.includes(location.host) && "focus" in client) {
          return client.focus().then(() => {
            if (client.navigate) return client.navigate(targetUrl);
          });
        }
      }
      return clients.openWindow(targetUrl);
    })
  );
});

/* ---------------------------------------------------------
   🔄 UPDATE NOTIFIER — SKIP WAITING
--------------------------------------------------------- */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    console.log("🔄 User clicked Update — activating new service worker");
    self.skipWaiting();
  }
});
