const CACHE_NAME = 'ysk-license-manager-v1.0.0';
const urlsToCache = [
  './',
  './firebase-license-system.html',
  './simple-firebase-system.js',
  './advanced-license-system.js',
  './license-generator.js',
  './firebase-config.js',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  // External resources that we want to cache
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Icons+Outlined',
  'https://cdn.jsdelivr.net/npm/crypto-js@4.2.0/crypto-js.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache.map(url => {
          // Handle external URLs differently
          if (url.startsWith('http')) {
            return new Request(url, { mode: 'cors' });
          }
          return url;
        }));
      })
      .catch(error => {
        console.log('Service Worker: Cache failed', error);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip Firebase requests - they need to be online
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase') ||
      event.request.url.includes('googleapis.com/firestore')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        if (response) {
          console.log('Service Worker: Serving from cache', event.request.url);
          return response;
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(response => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response because it's a stream
          const responseToCache = response.clone();

          // Add to cache for future use
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch(error => {
          console.log('Service Worker: Fetch failed, serving offline page', error);
          
          // Return a custom offline page for navigation requests
          if (event.request.destination === 'document') {
            return caches.match('./firebase-license-system.html');
          }
          
          // For other requests, you might want to return a default response
          return new Response('المحتوى غير متاح في وضع عدم الاتصال', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain; charset=utf-8'
            })
          });
        });
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  
  if (event.tag === 'license-upload') {
    event.waitUntil(
      // Handle offline license uploads when connection is restored
      handleOfflineLicenseUploads()
    );
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'إشعار جديد من YSK License Manager',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'فتح التطبيق',
        icon: './icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'إغلاق',
        icon: './icons/icon-96x96.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('YSK License Manager', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification clicked');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./')
    );
  }
});

// Handle offline license uploads
async function handleOfflineLicenseUploads() {
  try {
    // Get offline data from IndexedDB or localStorage
    const offlineData = JSON.parse(localStorage.getItem('offlineLicenseUploads') || '[]');
    
    if (offlineData.length > 0) {
      console.log('Service Worker: Processing offline uploads', offlineData.length);
      
      // Process each offline upload
      for (const licenseData of offlineData) {
        try {
          // Attempt to upload to Firebase
          const response = await fetch('/api/upload-license', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(licenseData)
          });
          
          if (response.ok) {
            console.log('Service Worker: Offline upload successful');
          }
        } catch (error) {
          console.log('Service Worker: Offline upload failed', error);
        }
      }
      
      // Clear offline data after processing
      localStorage.removeItem('offlineLicenseUploads');
    }
  } catch (error) {
    console.log('Service Worker: Error processing offline uploads', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', event => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});