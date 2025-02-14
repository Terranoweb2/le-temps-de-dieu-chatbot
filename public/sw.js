const CACHE_NAME = 'le-temps-de-dieu-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/icon-192x192.png',
    '/icon-512x512.png',
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    'https://res.cloudinary.com/dxy0fiahv/image/upload/v1732541188/logo_ydiaeh.png'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
});

// Stratégie de cache : Network First, puis Cache
self.addEventListener('fetch', (event) => {
    // Ne pas mettre en cache les requêtes POST
    if (event.request.method !== 'GET') return;

    // Ne pas mettre en cache les appels à l'API
    if (event.request.url.includes('/.netlify/functions/')) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Mettre en cache la nouvelle version
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                    .then((cache) => cache.put(event.request, responseClone));
                return response;
            })
            .catch(() => {
                // Utiliser la version en cache si la requête échoue
                return caches.match(event.request);
            })
    );
});
