const CACHE_NAME = 'mouse-scheduler-20250624v3';

const urlsToCache = [
    './',
    './index.html',
    './attach/calendar-icon.png',
    './attach/edit-icon.png',
    './attach/import-icon.png',
    './attach/overview-icon.png',
    './attach/settings-icon.png',
    './js/AIService.js',
    './js/Calendar.js',
    './js/GoogleService.js',
    './js/index.js',
    './js/Menu.js',
    './js/Overview.js',
    './js/Share.js',
    './js/TimeUtils.js',
    './js/TripData.js',
    './js/TripManager.js',
    './attach/icon-192.png',
    './attach/icon-512.png'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(name => {
                if (name !== CACHE_NAME) {
                    return caches.delete(name);
                }
            })
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response =>
            response || fetch(event.request)
        )
    );
});
