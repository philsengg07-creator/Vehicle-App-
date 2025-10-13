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

export default function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const registerDevice = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!window.Pushy) {
        throw new Error('Pushy SDK not loaded.');
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

    script.onload = () => {
      if (!window.Pushy) {
        console.error('Pushy SDK loaded but window.Pushy is not available.');
        setIsLoading(false);
        return;
      }
      
      window.Pushy.setOptions({ appId: PUSHY_APP_ID });

      navigator.serviceWorker.register('/service-worker.js')
        .then(() => {
          window.Pushy.isRegistered((err: any, registered: boolean) => {
            if (err) {
              console.error('Pushy isRegistered check failed:', err);
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
    };
    
    script.onerror = () => {
        console.error('Failed to load Pushy SDK script.');
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load push notification service.',
        });
        setIsLoading(false);
    }

    document.head.appendChild(script);

  }, [toast]);

  return (
    <PushNotificationsCard
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
