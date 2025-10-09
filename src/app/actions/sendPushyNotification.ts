'use server';

import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

export async function sendPushyNotification(message: string) {
  const apiKey = process.env.PUSHY_API_KEY;

  if (!apiKey) {
    console.error('Pushy API key is not configured.');
    return { success: false, error: 'Pushy API key is not configured.' };
  }

  try {
    const deviceTokenRef = ref(db, 'adminDeviceToken');
    const snapshot = await get(deviceTokenRef);
    const deviceToken = snapshot.val();

    if (!deviceToken) {
      console.log('No admin device token found. Skipping push notification.');
      return { success: false, error: 'Admin device not registered.' };
    }

    const payload = {
      to: deviceToken,
      data: {
        title: 'Vahicle App Notification',
        message: message,
      },
      notification: {
        title: 'Vahicle App',
        body: message,
        badge: 1,
        sound: 'default',
      },
    };

    const response = await fetch('https://api.pushy.me/push?api_key=' + apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.success) {
      return { success: true };
    } else {
      console.error('Pushy API error:', result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return { success: false, error: 'Failed to send notification.' };
  }
}
