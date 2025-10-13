// public/service-worker.js

// Import the Pushy SDK
importScripts('https://sdk.pushy.me/web/1.0.10/pushy-sdk.js');

// Your Pushy App ID
const PUSHY_APP_ID = '669677353f29e0689b900958';

// Set Pushy App ID
Pushy.setAppId(PUSHY_APP_ID);

// Start the Pushy service
Pushy.listen();
