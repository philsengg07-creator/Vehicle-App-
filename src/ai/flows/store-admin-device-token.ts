'use server';
/**
 * @fileOverview A Genkit flow for storing an admin's device token in Firebase.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getAdminApp } from '@/ai/firebase-admin';
import { getDatabase } from 'firebase-admin/database';

const StoreAdminDeviceTokenInputSchema = z.object({
  token: z.string().describe('The FCM device token.'),
});

export async function storeAdminDeviceToken(
  input: z.infer<typeof StoreAdminDeviceTokenInputSchema>
): Promise<void> {
  return storeAdminDeviceTokenFlow(input);
}

const storeAdminDeviceTokenFlow = ai.defineFlow(
  {
    name: 'storeAdminDeviceTokenFlow',
    inputSchema: StoreAdminDeviceTokenInputSchema,
    outputSchema: z.void(),
  },
  async ({ token }) => {
    try {
      const adminApp = getAdminApp();
      const db = getDatabase(adminApp);
      const tokensRef = db.ref('adminDeviceTokens');

      // Check if the token already exists
      const snapshot = await tokensRef.orderByValue().equalTo(token).once('value');

      if (!snapshot.exists()) {
        // If it doesn't exist, push the new token to the list
        await tokensRef.push(token);
        console.log(`Stored new admin device token in Firebase: ${token}`);
      } else {
        console.log(`Token already exists, no need to store: ${token}`);
      }
    } catch (error) {
      console.error('Error storing admin device token in Firebase:', error);
      // Re-throw the error to make it visible in server logs
      throw new Error('Failed to store admin device token.');
    }
  }
);
