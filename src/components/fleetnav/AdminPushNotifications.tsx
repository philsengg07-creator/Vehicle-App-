
"use client";

import { useEffect } from 'react';
import { getMessaging, getToken } from "firebase/messaging";
import { app, VAPID_KEY, db } from "@/lib/firebase";
import { ref, set } from "firebase/database";
import { useToast } from "@/hooks/use-toast";
import { storeAdminDeviceToken } from '@/app/actions/sendNotification';

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
            // Use the server action to store the token
            const result = await storeAdminDeviceToken(token);
            if (result.success) {
              console.log("✅ Admin token stored on the server.");
              toast({
                title: "Push Notifications Enabled",
                description: "You will now receive admin notifications on this device.",
              });
            } else {
              throw new Error(result.error || "Failed to store token on server.");
            }
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
