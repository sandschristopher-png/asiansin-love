self.addEventListener('push', function(event) {
  if (!event.data) return;
  const data = event.data.json();

  const options = {
    body: data.body || 'You have a new message waiting on Asians in Love.',
    icon: '/ail-logo.png',
    badge: '/ail-logo.png',
    image: data.image || '/dummy-1.jpg',
    data: { url: data.url || '/discover' },
    actions: [
      { action: 'open_chat', title: 'Reply Now' },
      { action: 'view_profile', title: 'View Profile' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Asians in Love', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/discover';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});