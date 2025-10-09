'use server';

import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export async function registerAdminDevice(token: string) {
  if (!token) {
    return { success: false, error: 'Device token is required.' };
  }

  try {
    const deviceTokenRef = ref(db, 'adminDeviceToken');
    await set(deviceTokenRef, token);
    return { success: true };
  } catch (error) {
    console.error('Error saving admin device token:', error);
    return { success: false, error: 'Failed to save admin device token.' };
  }
}
