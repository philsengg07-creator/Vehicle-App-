
import { NextResponse } from 'next/server';
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, update } from "firebase-admin/database";
import { getMessaging } from "firebase-admin/messaging";

let adminApp: App;

function getFirebaseAdmin(): App {
    if (getApps().some(app => app.name === 'adminApp')) {
        return getApps().find(app => app.name === 'adminApp')!;
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
    const tokensRef = db.ref("adminDeviceTokens");
    const snapshot = await tokensRef.once("value");

    if (!snapshot.exists()) {
      return NextResponse.json({ success: true, message: 'No tokens found' });
    }

    const tokensData = snapshot.val();
    const tokens = Object.values(tokensData) as string[];
    const tokenKeys = Object.keys(tokensData);
    
    if (tokens.length === 0) {
        return NextResponse.json({ success: true, message: 'No tokens found' });
    }

    const message = {
      notification: {
        title: 'Test Notification',
        body: 'If you see this, push is working 🎉'
      }
    };

    const messaging = getMessaging(app);
    const response = await messaging.sendToDevice(tokens, message);

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
        await update(db.ref(), tokensToDelete);
    }
    
    return NextResponse.json({ success: true, message: "Notification sent", response });
    
  } catch (err: any) {
    console.error("API send-notification error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
