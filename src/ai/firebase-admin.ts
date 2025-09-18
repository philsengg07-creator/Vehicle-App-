/**
 * @fileOverview Initializes and provides a singleton instance of the Firebase Admin SDK.
 */
import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

let adminApp: App;

function initializeAdminApp() {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return;
    }

    try {
        const serviceAccountPath = path.resolve(process.cwd(), 'ServiceAccountKey.json');
        if (!fs.existsSync(serviceAccountPath)) {
            throw new Error("ServiceAccountKey.json not found. Please download it from your Firebase project settings and place it in the project root.");
        }
        
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        adminApp = initializeApp({
            credential: cert(serviceAccount),
            databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        });
        console.log("Firebase Admin SDK initialized successfully.");

    } catch (e) {
        console.error("Could not initialize Firebase Admin SDK. The ServiceAccountKey.json file might be missing or invalid.", e);
        // We throw an error to prevent the app from running in a broken state.
        throw new Error("Firebase Admin SDK initialization failed.");
    }
}

// Initialize on module load.
initializeAdminApp();

// Export a function to get the initialized app.
export function getAdminApp(): App {
    if (!adminApp) {
        // This should not happen if the module is loaded correctly, but it's a safeguard.
        initializeAdminApp();
    }
    return adminApp;
}
