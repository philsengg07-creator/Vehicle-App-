
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, get, set } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

// Function to safely initialize and get the Firebase Admin app
function getFirebaseAdmin(): App {
    const apps = getApps();
    if (apps.length > 0 && apps.find(app => app.name === 'adminApp')) {
        return apps.find(app => app.name === 'adminApp')!;
    }

    try {
        let serviceAccount: any;
        const serviceAccountEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (serviceAccountEnv) {
            serviceAccount = JSON.parse(serviceAccountEnv);
        } else {
            // Fallback for local development if GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.
            const fs = require('fs');
            const path = require('path');
            const serviceAccountPath = path.resolve(process.cwd(), 'ServiceAccountKey.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountString);
            } else {
                 throw new Error("Could not initialize Firebase Admin SDK: ServiceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.");
            }
        }
        
        return initializeApp({
            credential: cert(serviceAccount),
            databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        }, 'adminApp');

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK in sendNotification.", e.message);
        throw e;
    }
}

export async function storeAdminDeviceToken(token: string) {
  try {
    const adminApp = getFirebaseAdmin();
    const db = getDatabase(adminApp);
    const tokenRef = ref(db, "adminDeviceToken");
    await set(tokenRef, token);
    console.log(`Stored latest admin device token.`);
    return { success: true };
  } catch (err: any) {
    console.error("Store token error:", err.message);
    return { success: false, error: err.message };
  }
}


export async function sendNotification(title: string, body: string) {
  try {
    const app = getFirebaseAdmin();
    const db = getDatabase(app);
    const tokenRef = ref(db, "adminDeviceToken");
    const snapshot = await get(tokenRef);

    if (!snapshot.exists()) {
      console.log('No admin device token found. Cannot send notification.');
      return { success: true, message: "No token found" };
    }

    const token = snapshot.val();
    
    if (!token) {
      console.log('Admin device token is empty. Cannot send notification.');
      return { success: true, message: "No token found" };
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    
    console.log('Successfully sent message:', response);
    return { success: true, message: "Notification sent" };
    
  } catch (err: any) {
    console.error("Send notification error:", err);
    
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
       console.log("Invalid or expired token detected. Removing from database.");
       try {
         const db = getDatabase(getFirebaseAdmin());
         const tokenRef = ref(db, "adminDeviceToken");
         await set(tokenRef, null);
       } catch (dbError) {
         console.error("Failed to remove token from database:", dbError);
       }
    }
    
    return { success: false, error: err.message };
  }
}
