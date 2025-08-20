self.addEventListener('install', (e)=>{
  e.waitUntil(
    caches.open('ysk-cache-v1').then(cache=>cache.addAll([
      './ysk.html',
      './ysk-manifest.json',
      './public/YSK PHONE.png',
      'https://cdn.tailwindcss.com',
      'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap',
      'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0',
      'https://cdnjs.cloudflare.com/ajax/libs/html5-qrcode/2.3.8/html5-qrcode.min.js'
    ]))
  );
});

self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(resp=> resp || fetch(e.request))
  );
});
