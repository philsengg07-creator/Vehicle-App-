'use server';
/**
 * @fileOverview A Genkit flow for sending push notifications to admins.
 */
import { ai } from '@/ai/genkit';
import { getAdminTokens } from '@/services/token-service';
import { z } from 'genkit';
import { getMessaging } from 'firebase-admin/messaging';
import { initializeApp, getApps, App } from 'firebase-admin/app';

const SendNotificationInputSchema = z.object({
  title: z.string().describe('The title of the notification.'),
  body: z.string().describe('The body of the notification.'),
});

let fcmApp: App | undefined = getApps().find(a => a.name === 'fcm');
if (!fcmApp) {
  fcmApp = initializeApp(
    { projectId: process.env.FIREBASE_PROJECT_ID },
    'fcm'
  );
}

export async function sendNotification(
  input: z.infer<typeof SendNotificationInputSchema>
): Promise<void> {
  return sendNotificationFlow(input);
}

const sendNotificationFlow = ai.defineFlow(
  {
    name: 'sendNotificationFlow',
    inputSchema: SendNotificationInputSchema,
    outputSchema: z.void(),
  },
  async ({ title, body }) => {
    const tokens = getAdminTokens();
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
      const response = await getMessaging(fcmApp).sendEachForMulticast(message);
      console.log('Successfully sent message:', response);
       if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        console.log('List of tokens that caused failures: ' + failedTokens);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
);
