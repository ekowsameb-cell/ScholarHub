const CACHE_NAME = 'scholarhub-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/App.css',
  '/src/context/AuthContext.tsx',
  '/src/components/Sidebar.tsx',
  '/src/components/RoleSwitcher.tsx',
  '/src/dbAdapter.ts',
  '/src/data/mockData.ts',
  '/src/services/aiService.ts',
  '/src/pages/DashboardOwner.tsx',
  '/src/pages/DashboardHeadmaster.tsx',
  '/src/pages/DashboardHOD.tsx',
  '/src/pages/DashboardTeacher.tsx',
  '/src/pages/DashboardCashier.tsx',
  '/src/pages/DashboardParent.tsx'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell and dependencies');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Interceptor
self.addEventListener('fetch', (event) => {
  // Only intercept HTTP/HTTPS GET requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response instantly
        return cachedResponse;
      }

      // If not cached, attempt network fetch
      return fetch(event.request)
        .then((response) => {
          // If response is valid, clone and cache it
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline and request is document (like navigation), fall back to index.html
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/index.html');
          }
        });
    })
  );
});
