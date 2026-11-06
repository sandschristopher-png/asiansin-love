// v2: stop caching /api responses (private data) - activating v2 deletes the old cache.
// v3: notification Reply / View actions.
// v4: precached offline fallback + app shell assets.
const CACHE_NAME = 'ail-cache-v4';
const OFFLINE_URL = '/offline.html';
// App shell that must work with no network. Next.js JS / CSS chunks are content-hashed and are
// cached at runtime on first use (fetch handler below).
const PRECACHE = [OFFLINE_URL, '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  // Never cache API responses (messages, profiles, signed URLs), auth hops or cross-origin requests.
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Pages: network first; offline falls back to the cached copy, then to the offline page.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((hit) => hit || caches.match(OFFLINE_URL))
      )
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      if (response && response.ok && event.request.url.startsWith(self.location.origin)) {
        const copy = response.clone();
        event.waitUntil(
          caches.open(CACHE_NAME).then((c) => c.put(event.request, copy))
        );
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});

// --- Push Notification Handler ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = { title: 'asiansin.love', body: event.data.text() };
  }

  const title = payload.title || 'asiansin.love';
  // Lock-screen buttons (Android / desktop Chrome, Edge; iOS shows the notification without them).
  const actions =
    payload.type === 'message'
      ? [{ action: 'reply', title: 'Reply' }, { action: 'view', title: 'View' }]
      : payload.type === 'match'
        ? [{ action: 'view', title: 'View' }]
        : [];
  const options = {
    actions,
    body: payload.body || 'You have a new update waiting.',
    icon: payload.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag || payload.type || 'ail-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      // lib/pushSender sends `url` (e.g. /chat/<senderId>); older payloads used link_url.
      linkUrl: payload.url || payload.link_url || payload.linkUrl || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// --- Notification Click Handler ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const baseUrl = event.notification.data?.linkUrl || '/';
  // Reply opens the chat with the composer focused (app/chat/[id] reads ?reply=1).
  const targetUrl = event.action === 'reply' ? baseUrl + (baseUrl.includes('?') ? '&' : '?') + 'reply=1' : baseUrl;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return Promise.all([
            'navigate' in client ? client.navigate(targetUrl) : Promise.resolve(),
            client.focus()
          ]);
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});