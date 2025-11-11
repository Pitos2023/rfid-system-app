importScripts('https://cdn.onesignal.com/sdks/OneSignalSDKWorker.js');

// Handle push notifications
self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Default Title';
  const options = {
    body: data.body || 'Default body text.',
    icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828640.png', // Your icon URL
    badge: 'https://cdn-icons-png.flaticon.com/512/1828/1828640.png', // Your badge URL
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Handle notification click in service worker (even when browser closed)
self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked in SW:', event);
  event.notification.close();
  
  const targetUrl = 'https://mastoparietal-besottingly-dann.ngrok-free.dev/parents?view=dashboard';
  
  event.waitUntil(
    clients.matchAll({type: 'window'}).then(function(clientList) {
      // Check if window already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/parents')) {
          return client.focus();
        }
      }
      // If not open, open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle notification dismiss
self.addEventListener('notificationclose', function(event) {
  console.log('Notification dismissed:', event);
});
