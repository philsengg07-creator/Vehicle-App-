let deviceToken = null;

try {
  importScripts('https://sdk.pushy.me/web/pushy-sw.js');
  console.log('Pushy SW loaded successfully');
} catch (e) {
  console.error('Failed to load Pushy SW:', e);
}


self.addEventListener('message', (event) => {
    if (event.data.type === 'GET_DEVICE_TOKEN') {
        if (typeof Pushy === 'undefined') {
            event.ports[0].postMessage({ error: 'Pushy SDK not loaded.' });
            return;
        }

        Pushy.setAppId(event.data.appId);

        Pushy.register()
            .then((token) => {
                deviceToken = token;
                event.ports[0].postMessage({ deviceToken: token });
            })
            .catch((err) => {
                event.ports[0].postMessage({ error: err.message });
            });
    }

    if (event.data.type === 'IS_REGISTERED') {
        if (typeof Pushy === 'undefined') {
             event.ports[0].postMessage({ isRegistered: false, error: 'Pushy SDK not loaded.' });
             return;
        }
        Pushy.isRegistered().then(isRegistered => {
             event.ports[0].postMessage({ isRegistered: isRegistered });
        });
    }
});

self.addEventListener('push', (event) => {
  if (typeof Pushy === 'undefined' || !Pushy.isPushyPush(event)) {
      return;
  }

  Pushy.handlePush(event);
});
