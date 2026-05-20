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


/**
 * 🛰️ Service Worker Push Messaging Extension
 * Handles background server push events and user click interactions.
 */

// 1. Listen for background push events from your server
self.addEventListener('push', (event) => {
  console.log('📡 [Service Worker] Push message received.');

  let title = 'Testing Hub Update';
  let options = {
    body: 'A fellow developer needs testers! Check the active tracks.',
    icon: 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/favicon.svg', // Match your project asset structure
    badge: 'https://raw.githubusercontent.com/erickouassi/App-Testing-Hub/main/img/favicon.svg',
    tag: 'hub-push-alert', // Overwrites previous notifications to prevent spamming
    data: { url: '/' }    // Context payload pass-through
  };

  // If your server sends a dynamic JSON string payload, parse it safely
  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.title || title;
      options.body = payload.body || options.body;
      if (payload.icon) options.icon = payload.icon;
      if (payload.url) options.data.url = payload.url;
    } catch (e) {
      // Fallback to raw text if it's not JSON
      options.body = event.data.text();
    }
  }

  // Keep the service worker alive until the notification is displayed
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// 2. Action handler: Direct the tester to your app when they tap the notification
self.addEventListener('notificationclick', (event) => {
  console.log('👆 [Service Worker] Notification clicked.');
  event.notification.close(); // Dimiss the banner instantly

  // Grab the destination URL passed from the push payload
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a tab is already open, focus it and navigate to the target route
      for (let client of windowClients) {
        if (client.url.includes(location.host) && 'focus' in client) {
          return client.focus().then(() => {
            if (client.navigate) return client.navigate(targetUrl);
          });
        }
      }
      // Otherwise, open a brand new browser tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});