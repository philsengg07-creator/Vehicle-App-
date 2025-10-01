
"use client";

import { useEffect } from 'react';
import { getMessaging, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";

export function PushNotifications() {

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !messaging) {
        return;
    }

    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);
      
      const { title, body } = payload.notification || {};
      if (title && body) {
          // Manually display a browser notification
          new Notification(title, { body });
      }
    });

    return () => unsubscribe();
  }, []);

  return null;
}
