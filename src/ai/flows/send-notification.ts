'use server';
/**
 * @fileOverview A Genkit flow for sending push notifications to admins.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps } from 'firebase-admin/app';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
}

export async function sendNotification(
  input: z.infer<typeof SendNotificationInputSchema>
): Promise<void> {
  return sendNotificationFlow(input);
}

const getAdminTokens = async (): Promise<string[]> => {
    const tokensRef = ref(db, 'adminDeviceTokens');
    const snapshot = await get(tokensRef);
    if (snapshot.exists()) {
        const tokensObject = snapshot.val();
        // Firebase returns an object of unique keys, so we get the values.
        return Object.values(tokensObject) as string[];
    }
    return [];
};


const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ title, body }) => {
    const tokens = await getAdminTokens();
    if (tokens.length === 0) {
      console.log('No admin device tokens to send notification to.');
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      tokens: tokens,
    };

    try {
      const response = await getMessaging().sendEachForMulticast(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
);
