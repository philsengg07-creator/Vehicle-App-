// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAdJXY7HLBRqWzur4JH3FNuVOCe_ItTyOk",
    authDomain: "studio-6451719734-ee0cd.firebaseapp.com",
    projectId: "studio-6451719734-ee0cd",
    storageBucket: "studio-6451719734-ee0cd.firebasestorage.app",
    messagingSenderId: "938204376421",
    appId: "1:938204376421:web:fc26601d358695c130858c",
    databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
