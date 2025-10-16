// Listen for incoming push notifications
self.addEventListener('push', function (event) {
    let data = {};
    try {
        data = event.data.json();
    } catch (e) {
        console.error("Pushy: invalid JSON payload");
    }

    const title = data.title || "New Notification";
    const body = data.message || "";
    const icon = data.icon || "https://sdk.pushy.me/web/assets/img/icon.png";

    const options = {
        body,
        icon,
        badge: icon,
        data: { url: data.url || "/" },
    };

    if (data._pushyCollapseKey) {
        options.tag = data._pushyCollapseKey;
    }

    // Display the notification
    event.waitUntil(self.registration.showNotification(title, options));

    // Send the data to all active clients (pages)
    clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clientsList) => {
        data._pushy = true;
        for (const client of clientsList) {
            client.postMessage(data);
        }
    });
});

// Handle notification clicks
self.addEventListener("notificationclick", function (event) {
    event.notification.close();
    const url = event.notification.data.url;
    if (url) {
        event.waitUntil(clients.openWindow(url));
    }
});
