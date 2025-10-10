// This file should be placed in the public directory

// Import the Pushy SDK
self.importScripts('https://sdk.pushy.me/web/1.0.24/pushy-sdk.js');

// Your Pushy App ID
const appId = '6696d5e75141b712a23e53b9';

// Initialize Pushy
new Pushy({ appId });

// Listen for push notifications
self.addEventListener('push', function (event) {
  // Fallback for empty push payload
  let notification = {
    title: 'Vahicle App',
    body: 'You have a new notification.'
  };

  // Attempt to parse push data
  if (event.data) {
    try {
      const data = event.data.json();
      notification.title = data.title || notification.title;
      notification.body = data.message || data.body;
      // You can also add other options like icon, data, etc.
      // notification.icon = data.icon;
    } catch (e) {
      console.error('Error parsing push data:', e);
    }
  }

  // Notification options
  const options = {
    body: notification.body,
    icon: '/icon-192x192.png', // Optional: path to an icon
    badge: '/badge-72x72.png', // Optional: path to a badge
    vibrate: [200, 100, 200], // Optional: vibration pattern
  };

  // Wait until the notification is shown
  event.waitUntil(self.registration.showNotification(notification.title, options));
});

// Listen for notification click
self.addEventListener('notificationclick', function (event) {
  // Close the notification
  event.notification.close();

  // Focus the client if available
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function (clients) {
      if (clients.length > 0) {
        // If a window is already open, focus it
        clients[0].focus();
      } else {
        // Otherwise, open a new window
        self.clients.openWindow('/');
      }
    })
  );
});
