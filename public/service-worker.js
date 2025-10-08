
// This is the required service worker file for Pushy Notifications.
// You can't change the name of this file, or the boilerplate code.
// You can add your own code to this file to handle specific push events.

// The following code is the boilerplate for Pushy:
self.addEventListener('push', function (event) {
    // Keep the service worker alive until the notification is created.
    event.waitUntil(
        // Show a notification with title, body, and icon.
        self.registration.showNotification(event.data.json().title, {
            body: event.data.json().body,
            icon: event.data.json().icon
        })
    );
});
