
'use client';

import { useEffect } from "react";
import Script from "next/script";
import { registerAdminDevice } from "@/app/actions/registerAdminDevice";

export function PushyInitializer() {
  useEffect(() => {
    // Register service worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/pushy-service-worker.js")
        .then(() => console.log("✅ Pushy service worker registered"))
        .catch(err => console.error("❌ Service worker registration failed:", err));
    }

    const handleSDKLoad = () => {
      if (typeof window !== 'undefined') {
        const Pushy = (window as any).Pushy;
        if (!Pushy) {
          console.error("Pushy SDK not found on window after script load.");
          return;
        }

        // Request notification permission
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            // This is just to confirm Pushy is loaded.
            // The actual registration will happen on button click in the admin dashboard.
            console.log('Pushy SDK loaded and ready.');
          }
        });
      }
    };
    
    // The script tag has an onLoad prop, but we'll also check manually
    // in case the component mounts after the script has already loaded.
    if (typeof window !== 'undefined' && (window as any).Pushy) {
      handleSDKLoad();
    }

  }, []);

  return (
    <Script 
      src="https://sdk.pushy.me/web/1.0.9/pushy-sdk.js" 
      strategy="lazyOnload"
      onLoad={() => {
        console.log('Pushy SDK script has loaded via next/script.');
        // The effect hook will handle the rest
      }}
      onError={(e) => {
        console.error("Failed to load Pushy SDK script:", e);
      }}
    />
  );
}
