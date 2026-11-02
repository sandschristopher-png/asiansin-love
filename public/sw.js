const CACHE_NAME = 'ail-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
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
    payload = { title: 'Asians in Love', body: event.data.text() };
  }

  const title = payload.title || 'Asians in Love';
  const options = {
    body: payload.body || 'You have a new update waiting.',
    icon: payload.icon || '/icon.svg', // Using SVG since PNGs aren't generated yet
    tag: payload.tag || 'ail-notification',
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      linkUrl: payload.link_url || payload.linkUrl || '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// --- Notification Click Handler ---
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.linkUrl || '/';

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