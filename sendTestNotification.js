// sendTestNotification.js
// A simple script to send a direct test notification to a specific device token.
// Usage: node sendTestNotification.js <YOUR_DEVICE_TOKEN>

const https = require('https');

// 1. Get the Secret API Key from your environment variables.
// You can also hardcode it here for quick testing, but this is not recommended for production.
const secretApiKey = process.env.PUSHY_API_KEY || 'YOUR_PUSHY_SECRET_API_KEY';

// 2. Get the device token from command-line arguments.
const deviceToken = process.argv[2];

if (!deviceToken) {
    console.error('❌ Usage: node sendTestNotification.js <DEVICE_TOKEN>');
    process.exit(1);
}

if (!secretApiKey || secretApiKey === 'YOUR_PUSHY_SECRET_API_KEY') {
    console.error('❌ Pushy Secret API Key is not set. Please set the PUSHY_API_KEY environment variable or edit this script.');
    process.exit(1);
}

console.log(`\n📲 Attempting to send a test notification to token: ${deviceToken}`);

// 3. Define the push notification payload.
const payload = {
    to: deviceToken,
    data: {
        title: 'Direct Token Test',
        message: 'If you see this, sending to a specific token is working! 🎉'
    },
    notification: {
        title: 'Direct Token Test',
        body: 'If you see this, sending to a specific token is working! 🎉',
        badge: 1,
        sound: 'ping.aiff'
    }
};

const postData = JSON.stringify(payload);

const options = {
    hostname: 'api.pushy.me',
    port: 443,
    path: `/push?api_key=${secretApiKey}`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

const req = https.request(options, (res) => {
    let responseBody = '';

    res.on('data', (chunk) => {
        responseBody += chunk;
    });

    res.on('end', () => {
        console.log('📬 Pushy API Response:', responseBody);
        try {
            const jsonResponse = JSON.parse(responseBody);
            if (jsonResponse.success) {
                console.log('\n✅ Notification sent successfully to Pushy. If you didn\'t see it, check the device token and client-side setup.');
            } else {
                console.error(`\n❌ Pushy reported an error: ${jsonResponse.error}`);
            }
        } catch (e) {
            console.error('\n🔥 Failed to parse Pushy API response.');
        }
    });
});

req.on('error', (e) => {
    console.error(`\n🔥 Problem with request: ${e.message}`);
});

// Write data to request body
req.write(postData);
req.end();
