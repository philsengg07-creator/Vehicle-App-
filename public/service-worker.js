
// This is a placeholder for the Pushy App ID. It will be replaced during the service worker registration.
let appId = null;

try {
    importScripts('https://sdk.pushy.me/web/pushy-sw.js');
} catch (e) {
    console.error('Failed to load Pushy SW:', e);
}


self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_DEVICE_TOKEN') {
        if (!self.Pushy) {
            event.ports[0].postMessage({ error: 'Pushy SDK not loaded.' });
            return;
        }
        
        self.Pushy.register({ appId })
            .then((deviceToken) => {
                event.ports[0].postMessage({ deviceToken });
            })
            .catch((err) => {
                event.ports[0].postMessage({ error: err.message });
            });
    }

    if(event.data && event.data.type === 'IS_REGISTERED') {
        if (!self.Pushy) {
            event.ports[0].postMessage({ isRegistered: false });
            return;
        }

        self.Pushy.isRegistered()
            .then(isRegistered => {
                event.ports[0].postMessage({ isRegistered });
            })
            .catch(() => {
                event.ports[0].postMessage({ isRegistered: false });
            });
    }
});


self.addEventListener('install', (event) => {
    const params = new URL(location).searchParams;
    appId = params.get('appId');
    self.skipWaiting();
});
