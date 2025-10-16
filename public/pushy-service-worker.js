// Listen for incoming push notifications
self.addEventListener('push', function (event) {
    // Extract payload as JSON object, default to empty object
    var data = event.data.json() || {};

    // Extract notification image URL
    var image = data.image || 'https://sdk.pushy.me/web/assets/img/icon.png';

    // Notification title and body
    var title = data.title || '';
    var body = data.message || '';

    // Notification options
    var options = {
        body: body,
        icon: image,
        badge: image,
        data: { url: data.url }
    };

    // Support for notification collapsing
    if (data['_pushyCollapseKey'])
        options.tag = data['_pushyCollapseKey'];
    
    // Wait until notification is shown
    event.waitUntil(self.registration.showNotification(title, options));

    // Send to Pushy notification listener (if webpage is open)
    clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
        // Set pushy notification flag
        data._pushy = true;
        
        // Send to all open pages
        clients.forEach(client => {
            client.postMessage(data, [new MessageChannel().port2]);
        });
    });
});

// Listen for notification click
self.addEventListener('notificationclick', function (event) {
    // Hide the notification
    event.notification.close();

    // Attempt to extract the URL from the notification's data
    var url = event.notification.data.url;

    // If a URL was specified
    if (url) {
        // Focus the browser tab with this URL
        event.waitUntil(clients.matchAll({ type: 'window' }).then(function (clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];

                // If we found a matching client
                if (client.url === url && 'focus' in client) {
                    return client.focus();
                }
            }

            // Otherwise, open a new tab
            if (clients.openWindow) {
                return clients.openWindow(url);
            }
        }));
    }
});
