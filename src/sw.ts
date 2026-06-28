/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope;

import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST);

// Listen for push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      
      const options: NotificationOptions = {
        body: data.body || 'Bạn có một thông báo mới từ Animon!',
        icon: data.icon || '/animon-logo.svg',
        badge: '/animon-logo.svg',

        data: {
          url: data.data?.url || '/',
        },
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Animon', options)
      );
    } catch (e) {
      console.error('Error parsing push data', e);
    }
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If so, just focus it.
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, then open the target URL in a new window/tab.
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
