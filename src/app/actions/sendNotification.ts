
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, get, update } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

// Function to safely initialize and get the Firebase Admin app
function getFirebaseAdmin(): App {
    const apps = getApps();
    if (apps.length > 0 && apps.find(app => app.name === 'adminApp')) {
        return apps.find(app => app.name === 'adminApp')!;
    }

    try {
        let serviceAccount: any;
        // Vercel and other platforms use FIREBASE_SERVICE_ACCOUNT_KEY
        // GOOGLE_APPLICATION_CREDENTIALS_JSON is a fallback
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

        if (serviceAccountEnv) {
            serviceAccount = JSON.parse(serviceAccountEnv);
        } else {
            // Fallback for local development if no env var is set.
            const fs = require('fs');
            const path = require('path');
            const serviceAccountPath = path.resolve(process.cwd(), 'ServiceAccountKey.json');
            if (fs.existsSync(serviceAccountPath)) {
                const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
                serviceAccount = JSON.parse(serviceAccountString);
            } else {
                 throw new Error("Could not initialize Firebase Admin SDK: Service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON environment variables, or place ServiceAccountKey.json in the project root.");
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

export async function sendNotification(title: string, body: string) {
  try {
    const app = getFirebaseAdmin();
    const db = getDatabase(app);
    const tokensRef = ref(db, "adminDeviceTokens");
    const snapshot = await get(tokensRef);

    if (!snapshot.exists()) {
      console.log('No admin device tokens found. Cannot send notification.');
      return { success: true, message: "No tokens found" };
    }

    const tokensData = snapshot.val();
    const tokens = Object.values(tokensData) as string[];
    const tokenKeys = Object.keys(tokensData);
    
    if (tokens.length === 0) {
      console.log('Admin device token list is empty. Cannot send notification.');
      return { success: true, message: "No tokens found" };
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendToDevice(tokens, message);
    
    console.log('Successfully sent message:', response);

    // Clean up invalid tokens
    const tokensToDelete: { [key: string]: null } = {};
    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            if (
                error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered'
            ) {
                const keyToDelete = tokenKeys[index];
                tokensToDelete[`/adminDeviceTokens/${keyToDelete}`] = null;
            }
        }
    });

    if (Object.keys(tokensToDelete).length > 0) {
        console.log("Removing invalid tokens:", Object.keys(tokensToDelete));
        const dbRef = ref(db);
        await update(dbRef, tokensToDelete);
    }
    
    return { success: true, message: "Notifications sent" };
    
  } catch (err: any) {
    console.error("Send notification error:", err);
    return { success: false, error: err.message };
  }
}
