
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { app, VAPID_KEY } from "@/lib/firebase";
import { storeAdminDeviceToken } from '@/app/actions/notificationActions';

export function AdminPushNotifications() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    const requestPermissionAndGetToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        console.log("🔔 Permission:", permission);

        if (permission === "granted") {
          const messaging = getMessaging(app);
          const token = await getToken(messaging, {
            vapidKey: VAPID_KEY,
          });

          if (token) {
            console.log("✅ New Admin Token:", token);
            const result = await storeAdminDeviceToken(token);
            if (result.success) {
              console.log("✅ Admin token stored on the server via Server Action.");
            } else {
              throw new Error(result.error || 'Failed to store admin token on server');
            }
          } else {
            console.log("❌ Could not get token for admin.");
          }
        }
      } catch (error) {
        console.error("An error occurred while getting admin token. ", error);
      }
    };
    
    requestPermissionAndGetToken();

  }, []);

  return null;
}
