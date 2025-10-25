
const CACHE_NAME = 'range-rider-cache-v3'; // Incremented version
const PRECACHE_ASSETS = [
  '/', // Caches the index.html at the root
  '/index.html', // Explicitly cache index.html
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event: precache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Pre-caching App Shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .catch(error => {
        console.error('[Service Worker] Failed to precache App Shell:', error);
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Force the new service worker to take control of the page immediately.
  self.clients.claim();
});

// Fetch event: Apply Stale-While-Revalidate strategy
self.addEventListener('fetch', event => {
  // Ignore requests to Firebase Firestore to prevent caching sensitive/dynamic data.
  if (event.request.url.includes('firestore.googleapis.com')) {
    // Let the network handle it without interception.
    return;
  }

  // Use the Stale-While-Revalidate strategy
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If the fetch is successful, clone it, cache it, and return it.
          // This handles opaque responses from CDNs correctly.
          if (networkResponse) {
              cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(err => {
            console.error('[Service Worker] Fetch failed:', err);
            // If fetch fails (e.g., offline) and we have a cached response,
            // we've already returned it. If not, this error propagates.
            // We could return an offline page here if we had one cached.
        });

        // Return the cached response immediately if it exists,
        // while the network request runs in the background to update the cache.
        return cachedResponse || fetchPromise;
      });
    })
  );
});
