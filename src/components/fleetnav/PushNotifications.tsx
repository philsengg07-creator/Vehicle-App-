"use client";

import { useEffect } from 'react';
import type Pushy from 'pushy-sdk-web';

export function PushNotifications() {
  useEffect(() => {
    // Dynamically import the Pushy SDK only on the client-side
    import('pushy-sdk-web').then(PushyModule => {
      const Pushy = PushyModule.default;
      
      // Prevent double registration
      if (Pushy.isRegistered()) {
        console.log('Pushy already registered.');
        return;
      }

      // Set up a listener for incoming push notifications
      Pushy.setNotificationListener((data: any) => {
        console.log('Received notification: ' + JSON.stringify(data));

        let title = data.title || 'Vahicle App';
        // Display the notification
        Pushy.notify(title, {
          body: data.message,
          icon: '/icon.png', // Assuming you have an icon in /public
        });
      });
    }).catch(error => {
      console.error("Failed to load Pushy SDK", error);
    });
  }, []);

  return null;
}
