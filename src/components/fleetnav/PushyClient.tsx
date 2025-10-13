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

export default function PushyClient() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.pushy.me/web/pushy-sdk.js';
    script.async = true;
    document.head.appendChild(script);

    const initializePushy = () => {
      try {
        if (!PUSHY_APP_ID) {
          console.error("Pushy App ID is not configured.");
          toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Pushy App ID is missing.',
          });
          setIsLoading(false);
          return;
        }

        window.Pushy.setOptions({
          serviceWorkerLocation: '/pushy-service-worker.js',
          appId: PUSHY_APP_ID,
        });

        window.Pushy.isRegistered((err: any, registered: boolean) => {
          if (err) {
            console.error('[Pushy] isRegistered check failed:', err);
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
        console.error('[Pushy] Initialization failed:', err);
        toast({
            variant: 'destructive',
            title: 'Initialization Failed',
            description: err.message || 'Could not initialize push notifications.',
        });
        setIsLoading(false);
      }
    };
    
    // Poll for Pushy SDK to be ready
    const interval = setInterval(() => {
      if (window.Pushy && typeof window.Pushy.setOptions === 'function') {
        clearInterval(interval);
        initializePushy();
      }
    }, 100);

    return () => {
      clearInterval(interval);
      document.head.removeChild(script);
    };

  }, [toast]);

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

  return (
    <PushNotificationsCard
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
