// BuyPass Multi-App Service Worker
const CACHE_NAME = 'buypass-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through for now to satisfy PWA requirements
  event.respondWith(fetch(event.request));
});
