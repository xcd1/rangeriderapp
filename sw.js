const CACHE_NAME = 'range-rider-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  // JS/TS files
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/firebase.ts',
  // components
  '/components/Sidebar.tsx',
  '/components/StudyView.tsx',
  '/components/ScenarioEditor.tsx',
  '/components/ImageUploader.tsx',
  '/components/ComparisonView.tsx',
  '/components/LoginView.tsx',
  '/components/ErrorBoundary.tsx',
  '/components/FilterBar.tsx',
  '/components/ConfirmationModal.tsx',
  // contexts
  '/contexts/AuthContext.tsx',
  // hooks
  '/hooks/useFirestoreNotebooks.ts',
  '/hooks/useLocalStorage.ts'
];

// Install: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Stale-while-revalidate strategy for dynamic content, cache-first for static assets
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request to use it both for fetch and cache
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                // Don't cache unsuccessful or opaque responses
              return networkResponse;
            }
            
            // Don't cache firestore requests to avoid data sync issues
            if (event.request.url.includes('firestore.googleapis.com')) {
                return networkResponse;
            }

            // Clone the response to use it both for browser and cache
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
    );
});
