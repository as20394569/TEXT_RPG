const C='ao-art-v1';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 if(u.pathname.includes('/art/')){e.respondWith(caches.open(C).then(c=>c.match(e.request).then(r=>{const f=fetch(e.request).then(n=>{if(n.ok)c.put(e.request,n.clone());return n}).catch(()=>r);return r||f})));return}
 e.respondWith(fetch(e.request).then(n=>{const cl=n.clone();caches.open('ao-page').then(c=>c.put(e.request,cl));return n}).catch(()=>caches.match(e.request)))});
