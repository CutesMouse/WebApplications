// CACHE_NAME
const CACHE_NAME = 'mouse-scheduler-20260126';

// App Shell：應用程式的核心檔案，讓網站能基本運作並顯示介面。
// 這些是使用者首次訪問時，需要被立刻快取的最小資源集。
const APP_SHELL_URLS = [
    './index.html',
    './attach/calendar-icon.png',
    './attach/edit-icon.png',
    './attach/import-icon.png',
    './attach/overview-icon.png',
    './attach/settings-icon.png',
    './js/index.js',
    './js/Share.js',
    './js/Menu.js',
    './js/Overview.js',
    './js/TimeUtils.js',
    './js/TripData.js',
    './js/TripManager.js',
    './attach/icon-192.png',
    './style/menu.css',
    './style/overview.css',
    './style/tailwind.min.css',
];

// 安裝 Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker: 安裝中...');
    // skipWaiting() 會強制讓新的 Service Worker 立即啟用，取代舊的。
    self.skipWaiting();

    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Service Worker: 正在快取 App Shell...');
            // 只快取核心 App Shell 資源，以加速首次載入。
            return cache.addAll(APP_SHELL_URLS);
        })
    );
});

// 啟用 Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker: 啟用中...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(name => {
                    // 刪除所有不是目前版本的舊快取
                    if (name !== CACHE_NAME) {
                        console.log('Service Worker: 正在清除舊快取 -', name);
                        return caches.delete(name);
                    }
                })
            );
        }).then(() => {
            // 立即控制所有客戶端（開啟的頁面）
            return self.clients.claim();
        })
    );
});

// 攔截網路請求 (Stale-While-Revalidate 策略)
self.addEventListener('fetch', event => {
    const { request } = event;

    // 對於非 GET 請求，或非 http/https 的請求，直接使用網路。
    if (request.method !== 'GET' || !request.url.startsWith('http')) {
        return;
    }

    event.respondWith(
        caches.match(request).then(cachedResponse => {
            // 優先從快取提供回應（Stale）
            if (cachedResponse) {
                // 在背景從網路重新獲取資源並更新快取（Revalidate）
                const fetchPromise = fetch(request).then(networkResponse => {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(request, networkResponse.clone());
                    });
                    return networkResponse;
                }).catch(err => {
                    console.error('Service Worker: 網路請求失敗', err);
                });
                // 立即回傳快取版本，不等待網路請求
                return cachedResponse;
            }

            // 如果快取中沒有，則從網路獲取
            return fetch(request).then(networkResponse => {
                // 並將新的回應存入快取
                return caches.open(CACHE_NAME).then(cache => {
                    // 對於非核心資源，在第一次請求時才加入快取
                    cache.put(request, networkResponse.clone());
                    return networkResponse;
                });
            }).catch(err => {
                console.error('Service Worker: 網路請求失敗且快取中無資料', err);
                // 可在此處回傳一個預設的離線頁面或圖片
            });
        })
    );
});

// 監聽來自客戶端的訊息
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

