'use server';
/**
 * @fileOverview A Genkit flow for sending push notifications to admins.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import * as fs from 'fs';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

// Ensure Firebase Admin is initialized only once.
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    let serviceAccount;
    try {
        // The service account key is read from the filesystem.
        const serviceAccountString = fs.readFileSync('ServiceAccountKey.json', 'utf8');
        serviceAccount = JSON.parse(serviceAccountString);
    } catch (e) {
        console.error("Could not read or parse ServiceAccountKey.json for Firebase Admin SDK.", e);
        throw new Error("Firebase Admin SDK setup failed. The ServiceAccountKey.json file might be missing or invalid.");
    }

    return initializeApp({
        credential: credential.cert(serviceAccount),
        databaseURL: "https://studio-6451719734-ee0cd-default-rtdb.asia-southeast1.firebasedatabase.app"
    });
}

const adminApp = getAdminApp();

export async function sendNotification(
  input: z.infer<typeof SendNotificationInputSchema>
): Promise<void> {
  return sendNotificationFlow(input);
}

const getAdminToken = async (): Promise<string | null> => {
    const tokenRef = ref(db, 'adminDeviceToken');
    const snapshot = await get(tokenRef);
    if (snapshot.exists()) {
        const token = snapshot.val();
        return token;
    }
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
      console.error('Error sending message:', error);
      // More detailed error logging
      if (error instanceof Error) {
        console.error(`Error name: ${error.name}, message: ${error.message}`);
      }
    }
  }
);
