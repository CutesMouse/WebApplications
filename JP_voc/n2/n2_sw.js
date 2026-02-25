const CACHE_NAME = 'mouse-n2voc-20260226';

const urlsToCache = [
    './',
    './index.html',
    './index.css',
    './../css/index.css',
    './../js/Control.js',
    './../js/Favorite.js',
    './../js/JapaneseGraphic.js',
    './../js/Question.js',
    './../js/ServiceConfig.js',
    './../js/Voc.js',
    './../js/VocCard.js',
    './../n1/Voc_List_n1.js',
    './../n2/Voc_List_n2.js',
    './../n3/Voc_List_n3.js',
    './../font/UDDigiKyokashoN-R.ttc',
    './../icons/n2-icon-48.ico',
    './../icons/n2-icon-512.png',
    './../icons/n2-icon-192.png'
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
