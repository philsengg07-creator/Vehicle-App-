// Attempt to import the Pushy service worker
try {
    importScripts('https://sdk.pushy.me/web/pushy-sw.js');
} catch (e) {
    console.error('Failed to load Pushy SW:', e);
}


self.addEventListener('message', event => {
    if (event.data && event.data.type === 'GET_DEVICE_TOKEN') {
        if (typeof Pushy === 'undefined') {
            event.ports[0].postMessage({ error: 'Pushy SDK not loaded in service worker.' });
            return;
        }
        Pushy.register({ appId: getAppId() })
            .then(deviceToken => {
                event.ports[0].postMessage({ deviceToken: deviceToken });
            })
            .catch(err => {
                event.ports[0].postMessage({ error: 'Pushy registration failed: ' + err.message });
            });
    }

    if (event.data && event.data.type === 'IS_REGISTERED') {
         if (typeof Pushy === 'undefined') {
            event.ports[0].postMessage({ isRegistered: false, error: 'Pushy SDK not loaded.' });
            return;
        }
        Pushy.isRegistered((err, isRegistered) => {
             event.ports[0].postMessage({ isRegistered: !err && isRegistered });
        });
    }
});


function getAppId() {
    const urlParams = new URLSearchParams(location.search);
    return urlParams.get('appId');
}
