"use client";

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { registerAdminDevice } from '@/app/actions/registerAdminDevice';
import { PushNotificationsCard } from './PushNotificationsCard';

const PUSHY_APP_ID = process.env.NEXT_PUBLIC_PUSHY_APP_ID;

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
      console.error("Pushy App ID is not configured. Please set NEXT_PUBLIC_PUSHY_APP_ID in .env.local");
      setIsLoading(false);
      return;
    }

    const interval = setInterval(() => {
      if (window.Pushy && typeof window.Pushy.setOptions === 'function') {
        clearInterval(interval);
        
        window.Pushy.setOptions({ appId: PUSHY_APP_ID });

        navigator.serviceWorker.register('/service-worker.js').then(() => {
          window.Pushy.isRegistered((err: any, registered: boolean) => {
            if (err) {
              console.error('Pushy isRegistered check failed:', err);
              setIsLoading(false);
              return;
            }
            setIsRegistered(registered);
            setIsLoading(false);
          });
        }).catch((err: any) => {
          console.error('Service Worker registration failed:', err);
          toast({
            variant: 'destructive',
            title: 'Critical Error',
            description: `Could not register the notification service: ${err.message}`,
          });
          setIsLoading(false);
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <PushNotificationsCard 
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
