
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";


function getFirebaseAdmin(): App {
    const apps = getApps();
    const adminApp = apps.find(app => app.name === 'adminApp');
    if (adminApp) {
        return adminApp;
    }

    try {
        const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
        const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app/";

        if (!serviceAccountEnv) {
             throw new Error("Could not initialize Firebase Admin SDK: Service account key not found. Please set FIREBASE_SERVICE_ACCOUNT_KEY environment variable.");
        }
        
        const serviceAccount = JSON.parse(serviceAccountEnv);

        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
        
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
    const tokenRef = db.ref("adminDeviceToken");
    const snapshot = await tokenRef.once("value");

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
      },
      token: token,
    };

    const messaging = getMessaging(app);
    const response = await messaging.send(message);
    
    return NextResponse.json({ success: true, message: "Notification sent", response });
    
  } catch (err: any) {
    console.error("API send-notification error:", err);
     if (err.code === 'messaging/registration-token-not-registered') {
        console.log("Token is not registered, removing from database.");
        const db = getDatabase(getFirebaseAdmin());
        const tokenRef = db.ref("adminDeviceToken");
        await tokenRef.remove();
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
