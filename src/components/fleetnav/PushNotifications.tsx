"use client";

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { registerAdminDevice } from '@/app/actions/registerAdminDevice';
import { PushNotificationsCard } from './PushNotificationsCard';

const PUSHY_APP_ID = process.env.NEXT_PUBLIC_PUSHY_APP_ID;

// Declare the Pushy type on the window object to satisfy TypeScript
declare global {
  interface Window {
    Pushy: any;
  }
}

export function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const registerDevice = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!window.Pushy) {
        throw new Error('Pushy SDK not ready.');
      }
      const deviceToken = await window.Pushy.register();
      const result = await registerAdminDevice(deviceToken);

      if (result.success) {
        setIsRegistered(true);
        toast({
          title: 'Success',
          description: 'Push notifications enabled for this device.',
        });
      } else {
        throw new Error(result.error || 'Server registration failed.');
      }
    } catch (err: any) {
      setIsRegistered(false);
      console.error('[Pushy] Registration failed:', err);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Could not register for push notifications.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!PUSHY_APP_ID) {
      console.error("Pushy App ID is not configured.");
      setIsLoading(false);
      return;
    }

    if (document.getElementById('pushy-sdk')) {
      return;
    }

    const script = document.createElement('script');
    script.id = 'pushy-sdk';
    script.src = 'https://sdk.pushy.me/web/1.0.10/pushy-sdk.js';
    script.async = true;
    document.head.appendChild(script);

    // This function will poll until the Pushy SDK is fully initialized
    const waitForPushy = () => {
      const interval = setInterval(() => {
        // Check for the object and the specific function we need
        if (window.Pushy && typeof window.Pushy.setOptions === 'function') {
          clearInterval(interval);
          initializePushy();
        }
      }, 100); // Check every 100ms
    };

    const initializePushy = () => {
      try {
        // Set the App ID - this is the correct place
        window.Pushy.setOptions({ appId: PUSHY_APP_ID });
  
        // Register the service worker
        navigator.serviceWorker.register('/service-worker.js')
          .then(() => {
            // Now that the SW is registered, check if the device is already registered
            window.Pushy.isRegistered((err: any, registered: boolean) => {
              if (err) {
                console.error('Pushy isRegistered check failed:', err);
                toast({
                  variant: 'destructive',
                  title: 'Error',
                  description: 'Could not check push notification status.',
                });
                setIsLoading(false);
                return;
              }
              setIsRegistered(registered);
              setIsLoading(false);
            });
          })
          .catch((err: any) => {
            console.error('Service Worker registration failed:', err);
            toast({
              variant: 'destructive',
              title: 'Critical Error',
              description: `Could not register the notification service: ${err.message}`,
            });
            setIsLoading(false);
          });
      } catch (err: any) {
        console.error('Error during Pushy initialization:', err);
        toast({
            variant: 'destructive',
            title: 'Initialization Failed',
            description: err.message || 'Could not initialize push notifications.',
        });
        setIsLoading(false);
      }
    };
    
    // Start polling when the component mounts
    waitForPushy();

  }, [toast]);

  return (
    <PushNotificationsCard
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
