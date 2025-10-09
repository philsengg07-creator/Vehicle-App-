// This file is required for Pushy notifications to work in the background.
// It must be placed in the root of your public directory.

// Import the Pushy SDK
importScripts('https://sdk.pushy.me/web/1.0.24/pushy-sdk.js');

// Your Pushy App ID
Pushy.setAppId('66a1332732913a0c6a99a775');

// Start the Pushy service worker
Pushy.listen();
