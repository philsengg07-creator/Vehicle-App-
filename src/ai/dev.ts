import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-notifications.ts';
import '@/ai/flows/store-admin-device-token.ts';
import '@/ai/flows/send-notification.ts';
