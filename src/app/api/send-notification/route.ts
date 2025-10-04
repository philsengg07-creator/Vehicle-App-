
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, get, remove } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";


function getFirebaseAdmin(): App {
    const apps = getApps();
    const adminApp = apps.find(app => app.name === 'adminApp');
    if (adminApp) {
        return adminApp;
    }

    try {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/";

        if (!serviceAccountEnv) {
             throw new Error("Could not initialize Firebase Admin SDK: Service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS_JSON environment variables.");
        }
        
        const serviceAccount = JSON.parse(serviceAccountEnv);
        
        return initializeApp({
            credential: cert(serviceAccount),
            databaseURL: databaseURL
        }, 'adminApp');

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK in sendNotification API.", e.message);
        throw e;
    }
}


export async function POST(request: Request) {
  try {
    const app = getFirebaseAdmin();
    const db = getDatabase(app);
    const tokenRef = ref(db, "adminDeviceToken");
    const snapshot = await get(tokenRef);

    if (!snapshot.exists()) {
      return NextResponse.json({ success: true, message: 'No token found' });
    }

    const token = snapshot.val() as string;
    
    if (!token) {
        return NextResponse.json({ success: true, message: 'No token found' });
    }

    const message = {
      notification: {
        title: 'Test Notification',
        body: 'If you see this, push is working 🎉'
      }
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendToDevice(token, message);

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
    
    return NextResponse.json({ success: true, message: "Notification sent", response });
    
  } catch (err: any) {
    console.error("API send-notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
