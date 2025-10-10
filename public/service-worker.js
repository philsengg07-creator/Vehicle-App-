// This file is required for Pushy notifications to work in the background.
// It must be placed in the root of your public directory.

// Import the Pushy SDK - Official URL
importScripts('https://pushy.me/sdk/web/pushy-sdk.js');

// Your Pushy App ID (updated to match dashboard)
try {
  if (typeof Pushy !== 'function') {
    throw new Error('Pushy is not a constructor in service worker');
  }
  Pushy.setAppId('68e6aecbb7e2f9df7184b4df');
  // Start the Pushy service worker
  Pushy.listen();
  console.log('Pushy service worker initialized successfully with App ID: 68e6aecbb7e2f9df7184b4df');
} catch (error) {
  console.error('Failed to initialize Pushy in service worker:', error);
}