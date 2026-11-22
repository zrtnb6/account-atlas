// 账号星图 offline shell. HTML: network first (3 s), then cache. Same-origin assets: cache first, refreshed in background.
const CACHE = 'atlas-v11';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.png', './icon-512.png', './logo.svg'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const put = (req, res) => { if (res && res.ok) { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return res; };
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;   // GitHub sync & favicon proxies go straight to network
  if (r.mode === 'navigate') {
    e.respondWith(new Promise(res => {
      let done = false;
      const fallback = () => caches.match('./index.html').then(c => c || caches.match('./')).then(c => { if (!done && c) { done = true; res(c); } });
      const t = setTimeout(fallback, 3000);
      fetch(r).then(n => { clearTimeout(t); put('./index.html', n.clone()); if (!done) { done = true; res(n); } })
        .catch(() => { clearTimeout(t); fallback().then(() => { if (!done) res(Response.error()); }); });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit => {
    const net = fetch(r).then(n => put(r, n)).catch(() => hit || caches.match(r, { ignoreSearch: true }));
    return hit || net;
  }));
});
