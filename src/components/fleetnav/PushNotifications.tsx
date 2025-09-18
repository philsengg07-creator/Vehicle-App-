
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { storeAdminDeviceToken } from '@/ai/flows/store-admin-device-token';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, VAPID_KEY } from "@/lib/firebase";

export function PushNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    // This effect should only run once on the client.
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }

    const messaging = getMessaging(app);

    // Handler for messages received while the app is in the foreground.
    onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    // Function to request permission and get token
    const requestPermissionAndGetToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        console.log("🔔 Permission:", permission);

        if (permission === "granted") {
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
          });

          if (token) {
            console.log("✅ Token:", token);
            await storeAdminDeviceToken({ token: token });
            console.log("✅ Token stored on the server.");
          } else {
            console.log("❌ Could not get token.");
          }
        }
      } catch (error) {
        console.error("An error occurred while getting token. ", error);
      }
    };
    
    requestPermissionAndGetToken();

  }, []); // Empty dependency array ensures this runs only once.

  // This component does not render anything to the DOM.
  return null;
}
