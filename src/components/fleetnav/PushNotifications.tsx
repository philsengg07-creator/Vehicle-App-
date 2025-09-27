
"use client";

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, onMessage } from "firebase/messaging";
import { app } from "@/lib/firebase";

export function PushNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
        return;
    }

    const messaging = getMessaging(app);

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("📩 Foreground message received:", payload);
      toast({
        title: payload.notification?.title,
        description: payload.notification?.body,
      });
    });

    return () => unsubscribe();
  }, [toast]);

  return null;
}
