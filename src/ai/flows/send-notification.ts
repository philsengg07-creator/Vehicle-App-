'use server';
/**
 * @fileOverview A Genkit flow for sending push notifications to admins.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App } from 'firebase-admin/app';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

// Ensure Firebase Admin is initialized only once.
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
} else {
  adminApp = getApps()[0];
}


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
      console.log('No admin device token to send notification to.');
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
    }
  }
);
