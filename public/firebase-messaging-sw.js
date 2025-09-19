
// DO NOT USE import/export
// This file is a service worker and must use importScripts.
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js");

// This config is replaced by a build script, do not change it manually
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
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // Optional: you can add an icon
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
