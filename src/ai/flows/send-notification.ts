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

const getAdminTokens = async (): Promise<string[]> => {
    const adminApp = getAdminApp();
    const adminDb = getDatabase(adminApp);
    const tokensRef = adminDb.ref('adminDeviceTokens');
    const snapshot = await tokensRef.once('value');
    if (snapshot.exists()) {
        const tokensObject = snapshot.val();
        // Firebase returns an object with push IDs as keys. We need the values.
        const tokens = Object.values(tokensObject) as string[];
        return tokens.filter(token => typeof token === 'string');
    }
    console.log('No admin device tokens found in Realtime Database.');
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
      console.log('No admin device tokens found. Cannot send notification.');
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
    };

    try {
      const adminApp = getAdminApp();
      // Use sendToDevice for multiple tokens
      const response = await getMessaging(adminApp).sendToDevice(tokens, message);
      console.log('Successfully sent message:', response);
      
      // Optional: Clean up invalid tokens from DB
      const tokensToRemove: Promise<void>[] = [];
      response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
          console.error('Failure sending notification to', tokens[index], error);
          // Cleanup the tokens who are not registered anymore.
          if (
            error.code === 'messaging/invalid-registration-token' ||
            error.code === 'messaging/registration-token-not-registered'
          ) {
            // Find the key of the invalid token and remove it
            const tokenToRemove = tokens[index];
            const tokensRef = getDatabase(adminApp).ref('adminDeviceTokens');
            tokensRef.orderByValue().equalTo(tokenToRemove).once('value', (snapshot) => {
                if (snapshot.exists()) {
                    const keyToRemove = Object.keys(snapshot.val())[0];
                    tokensToRemove.push(tokensRef.child(keyToRemove).remove());
                }
            });
          }
        }
      });
      await Promise.all(tokensToRemove);

    } catch (error) {
      console.error('Error sending message via Admin SDK:', error);
      // Re-throw to make failures visible.
      throw new Error('Failed to send push notification.');
    }
  }
);
