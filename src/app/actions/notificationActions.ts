
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, set, get } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;

// This function initializes the Firebase Admin SDK.
// It's defined and called only within this server-side file.
function initializeAdminApp() {
    // Return the existing app if it's already been initialized
    if (getApps().some(app => app.name === 'adminApp')) {
        adminApp = getApps().find(app => app.name === 'adminApp')!;
        return;
    }

    try {
        let serviceAccount: any;
        const serviceAccountEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (serviceAccountEnv) {
            console.log("Initializing Firebase Admin SDK from environment variable.");
            serviceAccount = JSON.parse(serviceAccountEnv);
        } else {
            const serviceAccountPath = path.resolve(process.cwd(), 'ServiceAccountKey.json');
            if (fs.existsSync(serviceAccountPath)) {
                console.log("Initializing Firebase Admin SDK from local ServiceAccountKey.json.");
                const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountString);
            } else {
                // If no credentials are found, we cannot proceed.
                // Log an error and skip initialization.
                console.error("Could not initialize Firebase Admin SDK: ServiceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.");
                return; 
            }
        }
        
        // Initialize the app with a unique name to avoid conflicts
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        }, 'adminApp');
        console.log("Firebase Admin SDK initialized successfully.");

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK.", e.message);
    }
}

// Ensure the Admin SDK is initialized when this module is loaded on the server.
initializeAdminApp();

// This function provides the initialized admin app, ensuring it's ready before use.
function getAdminApp(): App {
    if (!adminApp) {
        // This can happen if initialization failed (e.g., no credentials).
        // The calling function should handle this possibility.
        throw new Error("Firebase Admin SDK not initialized. Check server logs for details.");
    }
    return adminApp;
}


export async function storeAdminDeviceToken(token: string) {
  try {
    const db = getDatabase(getAdminApp());
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
    const app = getAdminApp();
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
         const db = getDatabase(getAdminApp());
         const tokenRef = ref(db, "adminDeviceToken");
         await set(tokenRef, null);
       } catch (dbError) {
         console.error("Failed to remove token from database:", dbError);
       }
    }
    
    return { success: false, error: err.message };
  }
}
