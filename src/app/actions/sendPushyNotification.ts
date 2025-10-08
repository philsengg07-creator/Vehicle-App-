'use server';

import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';

interface PushyPayload {
    to: string | string[];
    data: object;
    notification: object;
}

export async function sendPushyNotification(payload: PushyPayload) {
    const apiKey = process.env.PUSHY_API_KEY;
    if (!apiKey || apiKey.startsWith('YOUR_')) {
        const errorMessage = "Pushy API key is not configured. Please set PUSHY_API_KEY in your environment variables.";
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    // If sending to admins, fetch all registered admin tokens and add them to the payload
    if (payload.to === '/topics/admin') {
        try {
            const tokensRef = ref(db, 'adminDeviceTokens');
            const snapshot = await get(tokensRef);
            const storedTokens = snapshot.val();
            if (storedTokens) {
                const tokenList = Object.values(storedTokens) as string[];
                // Combine topic and individual tokens for max reliability
                payload.to = [...new Set(['/topics/admin', ...tokenList])];
                 console.log('Sending notification to admin topic and', tokenList.length, 'registered admin devices.');
            }
        } catch (dbError: any) {
            console.error("Error fetching admin device tokens, sending to topic only.", dbError);
            // Fallback to sending to topic only
            payload.to = '/topics/admin';
        }
    }


    const url = `https://api.pushy.me/push?api_key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Pushy API Error:', response.status, errorText);
            return { success: false, error: `Pushy API Error: ${errorText}` };
        }
        
        const responseData = await response.json();

        if (responseData.error) {
            console.error('Pushy API Error:', responseData.error);
            return { success: false, error: responseData.error };
        }

        console.log('Pushy push success:', responseData);
        return { success: true, response: responseData };
    } catch (error: any) {
        console.error('Error sending Pushy notification:', error);
        return { success: false, error: error.message };
    }
}
