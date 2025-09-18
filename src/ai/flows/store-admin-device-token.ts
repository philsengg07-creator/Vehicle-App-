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
      const tokenRef = db.ref('adminDeviceToken');
      await tokenRef.set(token);
      console.log(`Stored last admin device token in Firebase: ${token}`);
    } catch (error) {
      console.error('Error storing admin device token in Firebase:', error);
      // Re-throw the error to make it visible in server logs
      throw new Error('Failed to store admin device token.');
    }
  }
);
