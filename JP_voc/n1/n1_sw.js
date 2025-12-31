const CACHE_NAME = 'mouse-n1voc-20251231v2';

const urlsToCache = [
    './',
    './index.html',
    './index.css',
    './../js/Control.js',
    './../js/Favorite.js',
    './../js/JapaneseGraphic.js',
    './../js/Question.js',
    './../js/Voc.js',
    './Voc_List_n1.js',
    './../js/VocCard.js',
    './../font/UDDigiKyokashoN-R.ttc',
    './../icons/n1-icon-48.ico',
    './../icons/n1-icon-512.png',
    './../icons/n1-icon-192.png'
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
