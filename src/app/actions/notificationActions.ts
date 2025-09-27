
'use server';

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getDatabase, ref, set } from "firebase-admin/database";
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;

function initializeAdminApp() {
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
                console.error("Could not initialize Firebase Admin SDK: ServiceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.");
                return; 
            }
        }
        
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        }, 'adminApp');
        console.log("Firebase Admin SDK initialized successfully.");

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK.", e.message);
    }
}

initializeAdminApp();

function getAdminApp(): App {
    if (!adminApp) {
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
