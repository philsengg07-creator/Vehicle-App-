'use server';
/**
 * @fileOverview A Genkit flow for resetting daily app data.
 * This flow clears all taxi bookings, the waiting list, and notifications.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getDatabase } from 'firebase-admin/database';
import { getAdminApp } from '@/ai/firebase-admin';

export async function resetDailyData(): Promise<void> {
  return resetDailyDataFlow();
}

const resetDailyDataFlow = ai.defineFlow(
  {
    name: 'resetDailyDataFlow',
    inputSchema: z.void(),
    outputSchema: z.void(),
  },
  async () => {
    try {
      console.log('Running resetDailyDataFlow...');
      const adminApp = getAdminApp();
      const db = getDatabase(adminApp);
      
      const taxisRef = db.ref('taxis');
      const taxisSnapshot = await taxisRef.once('value');

      const updates: { [key: string]: any } = {};

      if (taxisSnapshot.exists()) {
        const taxis = taxisSnapshot.val();
        for (const taxiId in taxis) {
          updates[`/taxis/${taxiId}/bookings`] = null;
          updates[`/taxis/${taxiId}/bookedSeats`] = 0;
        }
      }

      updates['/remainingEmployees'] = null;
      updates['/notifications'] = null;

      await db.ref().update(updates);

      console.log('Daily data reset successfully.');
    } catch (error) {
      console.error('Error resetting daily data:', error);
      // Re-throw the error to ensure the client-side catch block is triggered.
      throw new Error('Failed to reset daily data.');
    }
  }
);
