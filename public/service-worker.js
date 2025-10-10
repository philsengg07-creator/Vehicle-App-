// DO NOT MODIFY //
// Pushy Service Worker
// Last updated: 2024-02-04

// Pushy App ID
const pushyAppId = '68e6aecbb7e2f9df7184b4df';

// Pushy Service Worker version
const pushyVersion = '1.0.18';

self.addEventListener('install', function (event) {
    self.skipWaiting();
});

self.addEventListener('push', function (event) {
    // Check for push notification payload
    if (event.data) {
        // Decode JSON payload
        var payload = event.data.json();

        // Default notification title
        var title = 'Pushy';

        // Custom notification title
        if (payload.title) {
            title = payload.title;
        }

        // Notification options
        var options = {
            body: payload.message,
            icon: payload.icon || 'https://pushy.me/images/icon.png',
            badge: payload.badge || 'https://pushy.me/images/icon.png',
            data: {
                url: payload.url
            }
        };

        // Vibration pattern
        if (payload.vibration) {
            options.vibration = payload.vibration;
        }

        // Sound
        if (payload.sound) {
            options.sound = payload.sound;
        }

        // Image
        if (payload.image) {
            options.image = payload.image;
        }

        // Wait until notification is shown
        event.waitUntil(self.registration.showNotification(title, options));

        // Send to Pushy reporting endpoint
        fetch('https://api.pushy.me/push/delivered?push_id=' + payload._pushyId, { method: 'POST', mode: 'no-cors' }).catch(function (err) {
            // Ignore errors
        });
    }
});

self.addEventListener('notificationclick', function (event) {
    // Hide notification
    event.notification.close();

    // Check for custom URL
    if (event.notification.data.url) {
        // Open the specified URL
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});
