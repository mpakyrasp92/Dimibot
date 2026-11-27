/* DimiBot – service worker: η εφαρμογή ανοίγει και χωρίς internet (χωρίς AI). */
const CACHE = 'dimibot-v13';
const FILES = ['./', 'index.html', 'css/style.css', 'js/store.js', 'js/voice.js', 'js/music.js', 'js/robot.js', 'js/ai.js', 'js/content.js', 'js/progress.js', 'js/arcade.js', 'js/mission.js', 'js/career.js', 'js/garage.js', 'js/play.js', 'js/app.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // ποτέ cache για AI
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(cc => cc.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
