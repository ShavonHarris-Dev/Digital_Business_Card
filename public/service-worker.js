const cacheName = "shavon-app-v1";
const assetsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.jpeg",
  "/icon-512.jpeg",
  '/Components.css',
  "/offline.html", 
  "/service-worker.js",
  // Add more assets you want to cache for offline use
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assetsToCache).catch((error) => {
        console.error('Failed to cache resources:', error);
        assetsToCache.forEach((url) => {
          fetch(url).catch((fetchError) => {
            console.error(`Failed to fetch ${url}:`, fetchError);
          });
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch((error) => {
        console.error('Fetch failed; returning offline page instead.', error);
        return caches.match('/offline.html');
      });
    })
  );
});
