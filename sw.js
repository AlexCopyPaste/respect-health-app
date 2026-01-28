const CACHE_NAME = 'respect-health-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    '/header_icon.png'
];

// התקנה ושמירת קבצים בזיכרון
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// שליפת קבצים מהזיכרון כשאין אינטרנט
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});