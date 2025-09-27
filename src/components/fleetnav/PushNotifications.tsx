
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { app, VAPID_KEY } from "@/lib/firebase";
import { storeAdminDeviceToken } from '@/app/actions/notificationActions';

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
            const result = await storeAdminDeviceToken(token);
            if(result.success) {
              console.log("✅ Token stored on the server via Server Action.");
            } else {
              throw new Error(result.error || 'Failed to store token on server');
            }
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
