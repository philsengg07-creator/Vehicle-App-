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

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

// Ensure Firebase Admin is initialized only once.
// This is a critical change to prevent re-initialization on every call.
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApps()[0];
    }

    // Check if the service account environment variable is set
    if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
        throw new Error('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Cannot initialize Firebase Admin SDK.');
    }
    
    // Parse the service account key from the environment variable
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    return initializeApp({
        credential: credential.cert(serviceAccount),
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
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
