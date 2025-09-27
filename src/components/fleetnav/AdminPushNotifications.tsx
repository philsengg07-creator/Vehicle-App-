
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { app, VAPID_KEY, db } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { useToast } from "@/hooks/use-toast";

export function AdminPushNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log("Push notifications not supported in this browser.");
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
            // Use the client-side SDK to store the token directly in the database
            const tokenRef = ref(db, "adminDeviceToken");
            await set(tokenRef, token);
            
            console.log("✅ Admin token stored in the database.");
            toast({
              title: "Push Notifications Enabled",
              description: "You will now receive admin notifications on this device.",
            });

          } else {
            console.log("❌ Could not get token for admin.");
            toast({
              variant: "destructive",
              title: "Could not get token",
              description: "Failed to retrieve push notification token.",
            });
          }
        } else {
            toast({
              variant: "destructive",
              title: "Push Notifications Denied",
              description: "You have denied permission for push notifications.",
            });
        }
      } catch (error: any) {
        console.error("An error occurred while getting admin token. ", error);
        toast({
            variant: "destructive",
            title: "Push Notification Error",
            description: `An error occurred: ${error.message}`,
        });
      }
    };
    
    requestPermissionAndGetToken();

  }, [toast]);

  return null;
}
