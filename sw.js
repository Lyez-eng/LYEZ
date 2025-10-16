// Версия кэша - меняйте при обновлении файлов
const CACHE_NAME = 'lyez-v1.3';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// Установка Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(function() {
        console.log('Service Worker: Skip waiting');
        return self.skipWaiting();
      })
  );
});

// Активация Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(function() {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Перехват запросов
self.addEventListener('fetch', function(event) {
  // Пропускаем не-GET запросы и chrome-extension
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Возвращаем кэшированную версию или делаем запрос
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        console.log('Service Worker: Fetching from network', event.request.url);
        return fetch(event.request).then(function(networkResponse) {
          // Кэшируем только успешные ответы и не кэшируем большие файлы
          if (networkResponse.status === 200 && 
              networkResponse.url.startsWith('http') &&
              !networkResponse.url.includes('/api/') &&
              networkResponse.headers.get('content-length') < 5000000) {
            
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        });
      })
      .catch(function(error) {
        // Fallback для offline
        console.log('Service Worker: Fetch failed; returning offline page', error);
        
        // Для основных страниц возвращаем закэшированную версию
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
        
        // Можно вернуть кастомную offline страницу
        return new Response('Нет соединения с интернетом', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Фоновая синхронизация (для будущих фич)
self.addEventListener('sync', function(event) {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Фоновая синхронизация данных
  console.log('Service Worker: Doing background sync');
}