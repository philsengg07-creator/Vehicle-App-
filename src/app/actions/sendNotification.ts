
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, get, remove } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

// Function to safely initialize and get the Firebase Admin app
function getFirebaseAdmin(): App {
    const apps = getApps();
    if (apps.length > 0) {
      const adminApp = apps.find(app => app.name === 'adminApp');
      if (adminApp) {
        return adminApp;
      }
    }

    try {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/";

        if (!serviceAccountEnv) {
            throw new Error("Could not initialize Firebase Admin SDK: Service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON environment variables.");
        }
        
        const serviceAccount = JSON.parse(serviceAccountEnv);

        // THE FIX: The private key from some sources has literal '\\n' instead of newlines.
        // We will programmatically replace them with actual newlines.
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
        return initializeApp({
            credential: cert(serviceAccount),
            databaseURL: databaseURL
        }, 'adminApp');

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK in sendNotification.", e.message);
        throw e;
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

    const token = snapshot.val() as string;
    
    if (!token) {
      console.log('Admin device token is empty. Cannot send notification.');
      return { success: true, message: "No token found" };
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendToDevice([token], message);
    
    console.log('Successfully sent message:', response);

    // Clean up invalid token
    if (response.failureCount > 0) {
        const error = response.results[0].error;
         if (error) {
            console.error('Failure sending notification to', token, error);
            if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
            ) {
                console.log("Removing invalid token.");
                await remove(tokenRef);
            }
        }
    }
    
    return { success: true, message: "Notification sent" };
    
  } catch (err: any)
   {
    console.error("Send notification error:", err);
    // Add this check to log the specific JWT error if it occurs
    if (err.code === 'app/invalid-credential' || (err.message && err.message.includes('Invalid JWT Signature'))) {
        console.error("Authentication failed: The service account key is likely misconfigured. Please check your environment variables.");
    }
    return { success: false, error: err.message };
  }
}
