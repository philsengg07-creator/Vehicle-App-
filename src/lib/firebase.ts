// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getMessaging } from 'firebase/messaging';
import { getInstallations } from 'firebase/installations';


const firebaseConfig = {
  apiKey: "AIzaSyAdJXY7HLBRqWzur4JH3FNuVOCe_ItTyOk",
  authDomain: "studio-6451719734-ee0cd.firebaseapp.com",
  projectId: "studio-6451719734-ee0cd",
  storageBucket: "studio-6451719734-ee0cd.firebasestorage.app",
  messagingSenderId: "938204376421",
  appId: "1:938204376421:web:fc26601d358695c130858c",
  databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const messaging = typeof window !== 'undefined' ? getMessaging(app) : undefined;
const installations = typeof window !== 'undefined' ? getInstallations(app) : undefined;
const db = getDatabase(app);


export { app, messaging, installations, db };
