const VERSION = 'rhythm-v2';
const SHELL = ['/', '/offline.html', '/manifest.webmanifest', '/assets/recall-landscape.webp', '/assets/recall-landscape-720.webp', '/assets/icon-192.png', '/assets/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    const response = await fetch(new Request('/', { cache: 'reload' }));
    const html = await response.clone().text();
    const builtAssets = Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g), (match) => match[1]);
    await cache.put('/', response);
    const urls = Array.from(new Set([...SHELL.filter((url) => url !== '/'), ...builtAssets]));
    await Promise.all(urls.map(async (url) => {
      const asset = await fetch(new Request(url, { cache: 'reload' }));
      if (asset.ok) await cache.put(url, asset);
    }));
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(async () => (await caches.match(event.request, { ignoreVary: true })) || (await caches.match('/', { ignoreVary: true })) || caches.match('/offline.html', { ignoreVary: true })));
    return;
  }

  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) caches.open(VERSION).then((cache) => cache.put(event.request, response.clone()));
    return response;
  })));
});
