// StockPro PWA Service Worker
const CACHE_NAME = 'stockpro-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/zziwa logo.png'
];

// Install: Cache critical static assets resiliently
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use allSettled so one missing asset doesn't fail installation
      const results = await Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn(`[PWA SW] Failed caching asset ${asset}:`, err);
          })
        )
      );
      return results;
    })
  );
  self.skipWaiting();
});

// Activate: Clean up older caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[PWA SW] Removing legacy cache: ${name}`);
            return caches.delete(name);
          }
          return null;
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API or WebSocket traffic
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Bypass API requests and chrome-extension schemes
  if (url.pathname.startsWith('/api') || url.protocol === 'chrome-extension:') {
    return;
  }

  const acceptHeader = event.request.headers.get('accept') || '';
  const isNavigation = event.request.mode === 'navigate' || acceptHeader.includes('text/html');

  if (isNavigation) {
    // Network-first strategy for HTML navigations to ensure latest code, fallback to cached index.html
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // Cache-first strategy for static assets (images, css, js, icons)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached immediately; optionally revalidate in background
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    })
  );
});

// Listen for skip waiting messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
