const C='ao-art-v25';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ao-art')&&k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
const get=(req,n)=>fetch(req).catch(err=>n>0?new Promise(r=>setTimeout(r,800)).then(()=>get(req,n-1)):Promise.reject(err));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 if(u.pathname.includes('/art/')){e.respondWith(caches.open(C).then(c=>c.match(e.request,{ignoreSearch:true}).then(r=>{const f=get(e.request,2).then(n=>{if(n.ok)c.put(e.request,n.clone());return n}).catch(()=>r||Response.error());return r||f})));return}
 e.respondWith(fetch(e.request).then(n=>{const cl=n.clone();caches.open('ao-page').then(c=>c.put(e.request,cl));return n}).catch(()=>caches.match(e.request)))});
