const CACHE_NAME = 'equal-play-v2';
const BASE_PATH = '/equal-play';
const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/vite.svg',
  // Note: The built JS/CSS files will be cached on first fetch
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Always try to fetch from network first for HTML files to get updates
        if (event.request.destination === 'document' || event.request.url.endsWith('.html')) {
          return fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              // Update cache with new content
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseToCache);
              });
              return networkResponse;
            }
            // If network fails, fallback to cache
            return response;
          }).catch(() => {
            // Network failed, return cached version if available
            return response;
          });
        }

        // For other resources, return cached version if available
        if (response) {
          return response;
        }

        // Clone the request for network fetch
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(networkResponse => {
          // Check if we received a valid response
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          // Clone the response for caching
          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
  );
});

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