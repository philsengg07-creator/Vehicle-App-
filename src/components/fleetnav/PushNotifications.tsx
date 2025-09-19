
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, VAPID_KEY } from "@/lib/firebase";

async function storeAdminDeviceToken(token: string) {
    try {
        const response = await fetch('/api/store-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to store token on server');
        }
        console.log("✅ Token stored on the server via API route.");
    } catch (error) {
        console.error("Error storing admin device token:", error);
        // Optionally show a toast to the user
    }
}

export function PushNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }

    const messaging = getMessaging(app);

    onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

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
            await storeAdminDeviceToken(token);
          } else {
            console.log("❌ Could not get token.");
          }
        }
      } catch (error) {
        console.error("An error occurred while getting token. ", error);
      }
    };
    
    requestPermissionAndGetToken();

  }, [toast]);

  return null;
}
