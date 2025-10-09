
"use client";

import { useEffect } from 'react';

export function PushNotifications() {
  useEffect(() => {
    // Dynamically import the Pushy SDK only on the client-side
    import('pushy-sdk-web').then(PushyModule => {
      const Pushy = PushyModule.default;
      // Set up a listener for incoming push notifications
      Pushy.setNotificationListener((data: any) => {
        console.log('Received notification: ' + JSON.stringify(data));

        let title = data.title || 'Vahicle App';
        // Display the notification
        Pushy.notify(title, {
          body: data.message,
          icon: data.icon,
        });
      });
    }).catch(error => {
      console.error("Failed to load Pushy SDK", error);
    });
  }, []);

  return null;
}
