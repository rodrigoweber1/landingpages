importScripts('version.js');
const CACHE = 'yourock-' + APP_VERSION;
const FILES = ['./', 'index.html', 'version.js', 'style.css', 'data.js', 'audio.js', 'mic-worklet.js', 'tools.js', 'tuner.js', 'quiz.js', 'chord-sequencer.js', 'account.js', 'reminder.js', 'i18n.js', 'app.js', 'manifest.webmanifest', 'icon.svg', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
// a cópia guardada é sempre um conjunto inteiro de UMA versão, baixado do servidor na instalação
// (cache:'reload' ignora a memória do navegador: o GitHub Pages manda guardar por 10 minutos)
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
// rede primeiro (com internet sempre carrega a versão mais nova); sem internet, ou com sinal muito fraco, usa a cópia guardada
const WAIT_PAGE = 3500, WAIT_FILE = 8000;
const fromCopy = new Set();   // telas abertas pela cópia: o resto dos arquivos delas também vem da cópia (não mistura versões)
// sem isto o navegador reaproveita arquivos da memória por 10 minutos, sem perguntar ao service worker (e fica na versão velha)
function live(r) {
  if (r.status !== 200) return r;
  const h = new Headers(r.headers); h.set('Cache-Control', 'no-cache');
  return new Response(r.body, { status: 200, statusText: r.statusText, headers: h });
}
self.addEventListener('fetch', e => {
  const q = e.request;
  // nunca intercepta chamadas ao Supabase nem a consulta de versão nova (no-store)
  if (q.method !== 'GET' || new URL(q.url).origin !== self.location.origin || q.cache === 'no-store') return;
  const page = q.mode === 'navigate', id = page ? e.resultingClientId : e.clientId;
  e.respondWith(caches.open(CACHE).then(c => c.match(q, { ignoreSearch: true })).then(copy => {
    if (copy && !page && fromCopy.has(id)) return copy;
    const net = fetch(q, { cache: 'no-cache' });   // confirma com o servidor se o arquivo mudou
    if (!copy) return net;
    return new Promise(done => {
      const useCopy = () => { if (page) fromCopy.add(id); done(copy); };
      const t = setTimeout(useCopy, page ? WAIT_PAGE : WAIT_FILE);
      net.then(r => { clearTimeout(t); if (r.status >= 500) useCopy(); else done(r); }, () => { clearTimeout(t); useCopy(); });
    });
  }).then(live));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => { const c = cs[0]; return c ? c.focus() : self.clients.openWindow('./'); }));
});
