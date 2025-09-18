'use server';
/**
 * @fileOverview A Genkit flow for storing an admin's device token.
 */
import { ai } from '@/ai/genkit';
import { addAdminToken } from '@/services/token-service';
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
    addAdminToken(token);
    console.log(`Stored admin device token: ${token}`);
  }
);
