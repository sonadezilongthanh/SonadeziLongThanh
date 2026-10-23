// Service Worker tối thiểu cho vỏ PWA "Bản đồ KCN Long Thành".
// Chỉ lưu đệm các file của vỏ; KHÔNG can thiệp dữ liệu app GAS (script.google.com).
// Khi sửa index.html / icon: tăng số phiên bản CACHE (v1 → v2) để máy người dùng nhận bản mới.
var CACHE = 'bando-kcn-v6';
var TAI_NGUYEN = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png',
  './icons/logo-tai.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(TAI_NGUYEN); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; })
        .map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return; // bỏ qua request tới Google
  // Ưu tiên mạng, mất mạng thì dùng bản lưu đệm
  e.respondWith(
    fetch(e.request).then(function (res) {
      var ban = res.clone();
      caches.open(CACHE).then(function (c) { c.put(e.request, ban); });
      return res;
    }).catch(function () {
      return caches.match(e.request, { ignoreSearch: true });
    })
  );
});
