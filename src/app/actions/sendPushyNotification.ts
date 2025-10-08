'use server';

interface PushyPayload {
    to: string | string[];
    data: object;
    notification: object;
}

export async function sendPushyNotification(payload: PushyPayload) {
    const apiKey = process.env.PUSHY_API_KEY;
    if (!apiKey || apiKey === 'YOUR_PUSHY_SECRET_API_KEY') {
        const errorMessage = "Pushy API key is not configured. Please set PUSHY_API_KEY in your environment variables.";
        console.error(errorMessage);
        return { success: false, error: errorMessage };
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

        const responseData = await response.json();

        if (!response.ok || responseData.error) {
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
