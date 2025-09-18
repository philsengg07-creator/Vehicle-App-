'use server';
/**
 * @fileOverview A Genkit flow for storing an admin's device token in Firebase.
 */
import { ai } from '@/ai/genkit';
import { db } from '@/lib/firebase';
import { ref, push, set } from 'firebase/database';
import { z } from 'genkit';

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
      const tokensRef = ref(db, 'adminDeviceTokens');
      const newTokenRef = push(tokensRef);
      await set(newTokenRef, token);
      console.log(`Stored admin device token in Firebase: ${token}`);
    } catch (error) {
      console.error('Error storing admin device token in Firebase:', error);
    }
  }
);
