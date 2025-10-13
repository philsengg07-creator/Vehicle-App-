// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';


export const firebaseConfig = {
  apiKey: "AIzaSyAdJXY7HLBRqWzur4JH3FNuVOCe_ItTyOk",
  authDomain: "studio-6451719734-ee0cd.firebaseapp.com",
  projectId: "studio-6451719734-ee0cd",
  storageBucket: "studio-6451719734-ee0cd.firebasestorage.app",
  appId: "1:938204376421:web:fc26601d358695c130858c",
  databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

export { app, db };
