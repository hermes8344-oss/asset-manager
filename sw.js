const CACHE = 'asset-app-v3';
const PRECACHE = ['./asset_app.html', './icon.svg', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // HTML 문서는 항상 네트워크에서 최신 버전 가져오기 (캐시 우회)
  const isDoc = e.request.destination === 'document' || e.request.url.includes('asset_app.html');
  const req = isDoc ? new Request(e.request, { cache: 'no-cache' }) : e.request;
  e.respondWith(
    caches.match(e.request).then(cached => {
      const networkFetch = fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
      return networkFetch.catch(() => cached);
    })
  );
});
