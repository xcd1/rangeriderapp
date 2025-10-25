const CACHE_NAME = 'range-rider-cache-v2'; // Increment version to force update

const LOCAL_ASSETS = [
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

const CDN_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://aistudiocdn.com/react@^19.2.0',
    'https://aistudiocdn.com/react-dom@^19.2.0/client',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
    'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'
];

const ALL_ASSETS_TO_CACHE = [...LOCAL_ASSETS, ...CDN_ASSETS];


// Install: Cache all static and CDN assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching all assets');
        return cache.addAll(ALL_ASSETS_TO_CACHE);
      })
      .catch(error => {
        console.error('Failed to cache assets during install:', error);
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Stale-while-revalidate strategy for dynamic content, cache-first for assets
self.addEventListener('fetch', event => {
  // Don't cache firestore requests to avoid data sync issues
  if (event.request.url.includes('firestore.googleapis.com')) {
      return;
  }
    
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache, fetch from network
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
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
