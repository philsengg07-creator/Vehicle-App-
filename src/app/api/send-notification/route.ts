
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

let adminApp: App;

function getFirebaseAdmin(): App {
    if (getApps().some(app => app.name === 'adminApp')) {
        return getApps().find(app => app.name === 'adminApp')!;
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
        
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        }, 'adminApp');
        return adminApp;

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK in sendNotification API.", e.message);
        throw e;
    }
}


export async function POST(request: Request) {
  try {
    const app = getFirebaseAdmin();
    const db = getDatabase(app);
    const tokenRef = db.ref("adminDeviceToken");
    const snapshot = await tokenRef.once("value");

    if (!snapshot.exists() || !snapshot.val()) {
      return NextResponse.json({ success: true, message: 'No tokens found' });
    }

    const token = snapshot.val();
    
    const message = {
      notification: {
        title: 'Test Notification',
        body: 'If you see this, push is working 🎉'
      },
      token: token,
    };

    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    
    return NextResponse.json({ success: true, message: "Notification sent", response });
    
  } catch (err: any) {
    console.error("API send-notification error:", err);
    if (
      err.code === 'messaging/invalid-registration-token' ||
      err.code === 'messaging/registration-token-not-registered'
    ) {
       console.log("Invalid or expired token detected. Removing from database.");
       try {
         const app = getFirebaseAdmin();
         const db = getDatabase(app);
         await db.ref("adminDeviceToken").set(null);
       } catch (dbError) {
         console.error("Failed to remove token from database:", dbError);
       }
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
