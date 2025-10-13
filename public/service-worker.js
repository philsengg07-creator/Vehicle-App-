/// <reference lib="webworker" />

// We need to keep track of the clients so we can send messages back to them
let clientPort = null;

try {
  importScripts('https://sdk.pushy.me/web/pushy-sw.js');
} catch (e) {
  console.error("Failed to load Pushy SW:", e);
}

self.addEventListener('message', (event) => {
  if (event.data.type === 'GET_DEVICE_TOKEN') {
    // Keep the port for later use
    clientPort = event.ports[0];

    if (typeof Pushy === 'undefined') {
        clientPort.postMessage({ error: 'Pushy SDK failed to load.' });
        return;
    }

    // Set the app ID
    Pushy.setAppId(event.data.appId);

    // Register the device for push notifications
    Pushy.register()
      .then((deviceToken) => {
        // Send the token back to the client
        clientPort.postMessage({ deviceToken: deviceToken });
      })
      .catch((err) => {
        // Send the error back to the client
        clientPort.postMessage({ error: err.message });
      });
  }
  
  if (event.data.type === 'IS_REGISTERED') {
    clientPort = event.ports[0];
    if (typeof Pushy !== 'undefined' && Pushy.isRegistered()) {
        clientPort.postMessage({ isRegistered: true });
    } else {
        clientPort.postMessage({ isRegistered: false });
    }
  }
});

// Listen for incoming push notifications
self.addEventListener('push', (event) => {
  // Extract the notification data from the push event
  const notification = event.data.json();

  // Display the notification
  event.waitUntil(
    self.registration.showNotification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico', // Optional
      // ... other options
    })
  );
});
