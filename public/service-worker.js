// Import the Pushy SDK
importScripts('https://pushy.me/sdk/web/pushy-sdk.js');

// Register the service worker with Pushy
Pushy.listen();

// Handle incoming push notifications
self.addEventListener('push', function (event) {
  // Extract the push notification payload
  const payload = event.data.json();

  // Display the push notification
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.message,
      icon: '/icon-192x192.png',
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  // Close the notification
  event.notification.close();

  // Example: Focus the app if it's open, or open a new tab
  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
      })
      .then(function (clientList) {
        for (var i = 0; i < clientList.length; i++) {
          var client = clientList[i];
          if (client.url == '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});
