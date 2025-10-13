// This file is intentionally left blank. 
// The Pushy service worker is loaded dynamically by the SDK.
self.addEventListener('push', function(event) {
    // Push notification received
    const data = event.data.json();

    // Show notification
    event.waitUntil(self.registration.showNotification(data.title, {
        body: data.message,
        icon: '/favicon.ico'
    }));
});
