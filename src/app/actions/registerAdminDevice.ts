'use server';

import { db } from '@/lib/firebase';
import { ref, push, get, child } from 'firebase/database';

export async function registerAdminDevice(token: string) {
    if (!token) {
        return { success: false, error: 'Device token is missing.' };
    }

    try {
        const tokensRef = ref(db, 'adminDeviceTokens');
        const snapshot = await get(tokensRef);
        const tokens = snapshot.val() || {};

        // Check if token already exists to avoid duplicates
        const tokenExists = Object.values(tokens).includes(token);

        if (tokenExists) {
            console.log('Admin device token already registered:', token);
            return { success: true, message: 'Token already registered.' };
        }

        // Add the new token to the list
        const newDeviceRef = push(tokensRef);
        await newDeviceRef.set(token);
        
        console.log('Successfully registered admin device token:', token);
        return { success: true, message: 'Device registered for admin notifications.' };
    } catch (error: any) {
        console.error('Error registering admin device token:', error);
        return { success: false, error: error.message };
    }
}
