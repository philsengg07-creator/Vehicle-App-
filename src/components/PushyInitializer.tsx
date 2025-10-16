"use client";

import { useEffect } from "react";
import Script from "next/script";
import { registerAdminDevice } from "@/app/actions/registerAdminDevice";
import { useApp } from "@/hooks/use-app";

// Declare Pushy on the window object
declare const Pushy: any;

export function PushyInitializer() {
  const { role } = useApp();

  useEffect(() => {
    // Only run this logic for admins
    if (role !== 'admin') {
      return;
    }
    
    // Wait until Pushy SDK is available
    async function initPushy() {
      // Check if Pushy is loaded on the window object
      if (typeof Pushy === "undefined") {
        console.warn("⏳ Pushy not loaded yet, waiting...");
        setTimeout(initPushy, 1000); // Check again in 1 second
        return;
      }

      try {
        // Check notification permission status
        if (Notification.permission === "default") {
          // Request permission if it's not granted or denied
          await Notification.requestPermission();
        }

        const pushyAppId = process.env.NEXT_PUBLIC_PUSHY_APP_ID;
        if (!pushyAppId) {
          console.error("❌ Pushy App ID is not configured. Please set NEXT_PUBLIC_PUSHY_APP_ID in your .env file.");
          return;
        }

        // Register the device for push notifications using the newer SDK method
        const deviceToken = await Pushy.register({ appId: pushyAppId });

        console.log("✅ Pushy device registered successfully!");
        console.log("Device Token:", deviceToken);

        // Send the device token to your backend to be saved
        await registerAdminDevice(deviceToken);

      } catch (err) {
        // Log any errors that occur during registration
        console.error("❌ Pushy registration failed:", err);
      }
    }

    // Start the initialization process
    initPushy();
  }, [role]); // Rerun the effect if the user role changes

  // Only render the script tag if the user is an admin
  if (role !== 'admin') {
    return null;
  }

  return (
    <Script
      src="https://sdk.pushy.me/web/1.0.9/pushy-sdk.js"
      strategy="afterInteractive"
      onLoad={() => console.log("✅ Pushy SDK script loaded")}
      onError={(e) => console.error("❌ Failed to load Pushy SDK", e)}
    />
  );
}
