const cacheName = "shavon-app-v1";
const assetsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/icon-192.jpeg",
  "/icon-512.jpeg",
  "/Components.css",
  "/offline.html",
  // Add other static assets as needed
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then(async (cache) => {
      for (const asset of assetsToCache) {
        try {
          await cache.add(asset);
          console.log(`Successfully cached: ${asset}`);
        } catch (error) {
          console.error(`Failed to cache ${asset}:`, error);
        }
      }
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch((error) => {
          console.error('Fetch failed; returning offline page instead.', error);
          return caches.match('/offline.html');
        })
      );
    })
  );
});
