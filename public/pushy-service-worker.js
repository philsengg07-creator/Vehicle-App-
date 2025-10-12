// This is a placeholder for the Pushy service worker code.
// The actual service worker code will be dynamically loaded by Pushy.
// You do not need to add any code here. Pushy handles it automatically.

// Listen for push notifications
self.addEventListener('push', function (event) {
    // Keep the service worker alive until the notification is created
    event.waitUntil(
        self.registration.showNotification('Vahicle App', {
            body: event.data.text(),
            icon: '/favicon.ico' // Optional: path to an icon
        })
    );
});

// Listen for notification click events
self.addEventListener('notificationclick', function (event) {
    // Hide the notification
    event.notification.close();

    // Focus the app if it's open
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(function (clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }
            return clients.openWindow('/');
        })
    );
});
