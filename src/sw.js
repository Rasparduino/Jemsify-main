// Service Worker for PWA functionality and offline caching
const CACHE_NAME = 'spotify-clone-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/index.css',
  // Add other static assets
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Handle audio streaming requests differently
  if (event.request.url.includes('/api/stream/')) {
    // Always fetch audio from network for real-time streaming
    event.respondWith(fetch(event.request));
    return;
  }

  // Handle other requests with cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Fallback for offline scenarios
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Background sync for download queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'download-queue') {
    event.waitUntil(processDownloadQueue());
  }
});

async function processDownloadQueue() {
  // Process any pending downloads when connection is restored
  const downloadQueue = await getDownloadQueue();
  
  for (const download of downloadQueue) {
    try {
      await fetch('/api/download', {
        method: 'POST',
        body: JSON.stringify(download)
      });
    } catch (error) {
      console.error('Background download failed:', error);
    }
  }
}

async function getDownloadQueue() {
  // Retrieve download queue from IndexedDB
  return [];
}