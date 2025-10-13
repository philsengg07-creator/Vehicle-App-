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

    const waitForPushy = () => {
      const interval = setInterval(() => {
        if (window.Pushy && typeof window.Pushy.setOptions === 'function') {
          clearInterval(interval);
          initializePushy();
        }
      }, 100);
    };

    const initializePushy = () => {
      try {
        window.Pushy.setOptions({
          serviceWorkerLocation: '/pushy-service-worker.js',
          appId: PUSHY_APP_ID,
        });

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
