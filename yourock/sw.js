importScripts('version.js');
const CACHE = 'yourock-' + APP_VERSION;
const FILES = ['./', 'index.html', 'version.js', 'style.css', 'data.js', 'audio.js', 'tools.js', 'quiz.js', 'chord-sequencer.js', 'account.js', 'reminder.js', 'i18n.js', 'app.js', 'manifest.webmanifest', 'icon.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
// network-first: com internet sempre carrega a versão mais nova (evita mostrar exercícios antigos); sem internet usa o cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;   // nunca cacheia chamadas ao Supabase
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  }).catch(() => caches.match(e.request)));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs[0]; return c ? c.focus() : self.clients.openWindow('./'); }));
});
