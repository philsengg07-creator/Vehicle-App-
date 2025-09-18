'use server';
/**
 * @fileOverview A Genkit flow for sending push notifications to admins.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getDatabase as getAdminDatabase } from 'firebase-admin/database';
import * as fs from 'fs';
import * as path from 'path';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

let adminApp: App;

// This function ensures Firebase Admin is initialized only once.
function initializeAdminApp() {
    if (getApps().length > 0) {
        adminApp = getApps()[0];
        return;
    }

    try {
        const serviceAccountPath = path.resolve(process.cwd(), 'ServiceAccountKey.json');
        const serviceAccountString = fs.readFileSync(serviceAccountPath, 'utf8');
        const serviceAccount = JSON.parse(serviceAccountString);

        adminApp = initializeApp({
            credential: credential.cert(serviceAccount),
            databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
        });
    } catch (e) {
        console.error("Could not read or parse ServiceAccountKey.json for Firebase Admin SDK.", e);
        throw new Error("Firebase Admin SDK setup failed. The ServiceAccountKey.json file might be missing or invalid.");
    }
}

// Initialize the app when the module is loaded.
initializeAdminApp();


export async function sendNotification(
  input: z.infer<typeof SendNotificationInputSchema>
): Promise<void> {
  return sendNotificationFlow(input);
}

const getAdminToken = async (): Promise<string | null> => {
    const adminDb = getAdminDatabase(adminApp);
    const tokenRef = adminDb.ref('adminDeviceToken');
    const snapshot = await tokenRef.once('value');
    if (snapshot.exists()) {
        const token = snapshot.val();
        return token;
    }
    console.log('Admin device token not found in Realtime Database.');
    return null;
};


const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ title, body }) => {
    const token = await getAdminToken();
    if (!token) {
      console.log('No admin device token found. Cannot send notification.');
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      token: token,
    };

    try {
      const response = await getMessaging(adminApp).send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message via Admin SDK:', error);
    }
  }
);
