// Summarize Notifications
'use server';
/**
 * @fileOverview This file defines a Genkit flow for summarizing taxi booking notifications for admins.
 *
 * - summarizeNotifications - A function that takes a list of notifications and returns a summarized digest.
 * - SummarizeNotificationsInput - The input type for the summarizeNotifications function.
 * - SummarizeNotificationsOutput - The return type for the summarizeNotifications function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeNotificationsInputSchema = z.object({
  notifications: z
    .array(z.string())
    .describe('A list of taxi booking update notifications.'),
});
export type SummarizeNotificationsInput = z.infer<
  typeof SummarizeNotificationsInputSchema
>;

const SummarizeNotificationsOutputSchema = z.object({
  summary: z.string().describe('A summarized digest of the notifications.'),
});
export type SummarizeNotificationsOutput = z.infer<
  typeof SummarizeNotificationsOutputSchema
>;

export async function summarizeNotifications(
  input: SummarizeNotificationsInput
): Promise<SummarizeNotificationsOutput> {
  return summarizeNotificationsFlow(input);
}

const summarizeNotificationsPrompt = ai.definePrompt({
  name: 'summarizeNotificationsPrompt',
  input: {schema: SummarizeNotificationsInputSchema},
  output: {schema: SummarizeNotificationsOutputSchema},
  prompt: `You are an AI assistant helping an admin understand the current state of taxi utilization.  Summarize the following notifications into a concise digest.  Focus on key information such as taxi capacity and remaining employees.\n\nNotifications:\n{{#each notifications}}- {{{this}}}\n{{/each}}\n\nSummary:`,
});

const summarizeNotificationsFlow = ai.defineFlow(
  {
    name: 'summarizeNotificationsFlow',
    inputSchema: SummarizeNotificationsInputSchema,
    outputSchema: SummarizeNotificationsOutputSchema,
  },
  async input => {
    const {output} = await summarizeNotificationsPrompt(input);
    return output!;
  }
);
