'use server';
/**
 * @fileOverview A Genkit flow for sending push notifications to admins.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { getDatabase } from 'firebase-admin/database';
import { getAdminApp } from '@/ai/firebase-admin';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

export async function sendNotification(
  input: z.infer<typeof SendNotificationInputSchema>
): Promise<void> {
  return sendNotificationFlow(input);
}

const getAdminToken = async (): Promise<string | null> => {
    const adminApp = getAdminApp();
    const adminDb = getDatabase(adminApp);
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
      const adminApp = getAdminApp();
      const response = await getMessaging(adminApp).send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message via Admin SDK:', error);
      // Re-throw to make failures visible.
      throw new Error('Failed to send push notification.');
    }
  }
);
