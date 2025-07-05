/* service-worker.js
 * Cache estático e atualização simples para PWA
 */

const CACHE_NAME = 'controle-mensalidades-v1';
const ASSETS = [
  '/',               // raiz
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/js/main.js',
  '/js/auth.js',
  '/js/profile.js',
  '/js/centers.js',
  '/js/students.js',
  '/js/utils.js',
  '/js/totals.js',
  '/js/payments.js',
  '/js/defaulters.js',
  '/js/ui.js',
  'https://cdn.tailwindcss.com'            // CDN Tailwind
];

/* ----- INSTALAÇÃO ----- */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/* ----- ATIVAÇÃO (limpa caches antigos) ----- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

/* ----- FETCH (cache-first) ----- */
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => 
      cached || fetch(event.request).then(resp => {
        // Armazena novos requests em cache
        const cloned = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        return resp;
      }).catch(() => cached) // offline fallback
    )
  );
});
