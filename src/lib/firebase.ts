// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAdJXY7HLBRqWzur4JH3FNuVOCe_ItTyOk",
  authDomain: "studio-6451719734-ee0cd.firebaseapp.com",
  projectId: "studio-6451719734-ee0cd",
  storageBucket: "studio-6451719734-ee0cd.firebasestorage.app",
  messagingSenderId: "938204376421",
  appId: "1:938204376421:web:fc26601d358695c130858c"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const messaging = typeof window !== 'undefined' ? getMessaging(app) : undefined;

export { app, messaging };
