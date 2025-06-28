const CACHE_NAME = 'mouse-n2voc-20250628';

const urlsToCache = [
    './',
    './index_n2.html',
    './index_n2.css',
    './Control.js',
    './Favorite.js',
    './JapaneseGraphic.js',
    './Question.js',
    './Voc.js',
    './Voc_List_n2.js',
    './VocCard.js',
    './font/UDDigiKyokashoN-R.ttc',
    './icons/n2-icon-512.png',
    './icons/n2-icon-192.png'
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
