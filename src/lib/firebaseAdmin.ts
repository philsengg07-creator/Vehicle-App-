import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App | undefined;

function initializeAdminApp(): App {
    if (adminApp) {
        return adminApp;
    }

    const apps = getApps();
    if (apps.length > 0 && apps.find(app => app.name === 'adminApp')) {
        adminApp = apps.find(app => app.name === 'adminApp')!;
        return adminApp;
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
                throw new Error("Could not initialize Firebase Admin SDK: ServiceAccountKey.json not found and GOOGLE_APPLICATION_CREDENTIALS_JSON is not set.");
            }
        }
        
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        }, 'adminApp');
        console.log("Firebase Admin SDK initialized successfully.");
        return adminApp;

    } catch (e: any) {
        console.error("Could not initialize Firebase Admin SDK.", e.message);
        throw e;
    }
}

export function getFirebaseAdmin(): App {
    return initializeAdminApp();
}
