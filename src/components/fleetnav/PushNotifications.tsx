
"use client";

import { useEffect } from 'react';
import Pushy from 'pushy-sdk-web';

export function PushNotifications() {
  useEffect(() => {
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
  }, []);

  return null;
}
