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
    
    // Register the service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/pushy-service-worker.js")
        .then(() => console.log("✅ Pushy service worker registered"))
        .catch(err => console.error("❌ Service worker registration failed:", err));
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

        // Register the device for push notifications using the newer SDK method
        // 🔹 This is your actual Pushy App ID from the Pushy Dashboard
        const deviceToken = await Pushy.register({ appId: "668b8e05fdf91929a73373b5" });

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
