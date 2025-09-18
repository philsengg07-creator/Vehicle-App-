// src/components/fleetnav/PushNotifications.tsx
"use client";

import { useEffect } from 'react';
import { messaging } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';

export function PushNotifications() {
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && messaging) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('Service Worker registration successful, scope is:', registration.scope);
          
          Notification.requestPermission().then(async (permission) => {
            if (permission === 'granted') {
              console.log('Notification permission granted.');
              try {
                const currentToken = await getToken(messaging, { serviceWorkerRegistration: registration, vapidKey: 'BNn7tq1_bQWAlsB4_g8Awiuq5TQ5Kbu6fPRdD5F-eE6l_acofd0KXBQvKKI2nnFcdMCx3nOgqaQC1hLCCA-lwr4' });
                if (currentToken) {
                  console.log('FCM Token:', currentToken);
                  // Here you would typically send the token to your server
                  // to store it for sending notifications later.
                  // For this demo, we'll just log it.
                } else {
                  console.log('No registration token available. Request permission to generate one.');
                }
              } catch (err) {
                console.log('An error occurred while retrieving token. ', err);
                toast({
                    variant: "destructive",
                    title: "Could not get notification token",
                    description: "Please ensure push notifications are not blocked for this site."
                });
              }
            } else {
              console.log('Unable to get permission to notify.');
            }
          });

        }).catch((err) => {
          console.log('Service Worker registration failed:', err);
        });
    }
  }, [toast]);

  return null;
}
