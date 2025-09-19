import { config } from 'dotenv';
config();

// Ensure admin app is initialized at the start
import '@/ai/firebase-admin';

import '@/ai/flows/summarize-notifications.ts';
import '@/ai/flows/store-admin-device-token.ts';
import '@/ai/flows/send-notification.ts';
import '@/ai/flows/reset-daily-data.ts';
