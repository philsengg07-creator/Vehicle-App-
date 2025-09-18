// public/firebase-messaging-sw.js

// Must use `require` instead of `import` in service workers.
const firebase = require('firebase/app');
require('firebase/messaging');

const firebaseConfig = {
    apiKey: "AIzaSyAdJXY7HLBRqWzur4JH3FNuVOCe_ItTyOk",
    authDomain: "studio-6451719734-ee0cd.firebaseapp.com",
    projectId: "studio-6451719734-ee0cd",
    storageBucket: "studio-6451719734-ee0cd.firebasestorage.app",
    messagingSenderId: "938204376421",
    appId: "1:938204376421:web:fc26601d358695c130858c",
    databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize the Firebase app in the service worker
if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
}

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico' // Optional: you can add an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
