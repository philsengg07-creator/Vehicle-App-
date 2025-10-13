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
    // Prevent script from running on server
    if (typeof window === 'undefined') {
        return;
    }

    // If script is already loaded by this component, don't load it again
    if (window.Pushy) {
        window.Pushy.isRegistered((err: any, registered: boolean) => {
            if (err) return;
            setIsRegistered(registered);
            setIsLoading(false);
        });
        return;
    }
    
    // Create script element
    const script = document.createElement('script');

    // Set script cross-origin attribute
    script.crossOrigin = 'anonymous';
    
    // Set script source
    script.src = 'https://sdk.pushy.me/web/pushy-sdk.js';

    // Set script to async
    script.async = true;

    // Script onload event listener
    script.onload = () => {
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
    };

    // Script on-error event listener
    script.onerror = () => {
        console.error("Failed to load Pushy SDK script.");
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not load push notification service.',
        });
        setIsLoading(false);
    };

    // Append script to document head
    document.head.appendChild(script);

    // Clean up script tag on component unmount
    return () => {
      const existingScript = document.querySelector('script[src="https://sdk.pushy.me/web/pushy-sdk.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
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
