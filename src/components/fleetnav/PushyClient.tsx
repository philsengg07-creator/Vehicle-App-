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

  const registerDevice = useCallback(async () => {
    if (!window.Pushy) {
      toast({
        variant: 'destructive',
        title: 'Pushy Not Ready',
        description: 'Pushy SDK is not available. Please refresh the page.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const deviceToken = await window.Pushy.register({ appId: PUSHY_APP_ID });
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
    if (typeof window === 'undefined' || window.Pushy) {
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.pushy.me/web/pushy-sdk.js';
    script.async = true;

    script.onload = () => {
      console.log('Pushy SDK loaded successfully.');
      if (window.Pushy) {
        window.Pushy.setOptions({
          serviceWorkerLocation: '/pushy-service-worker.js',
        });

        window.Pushy.isRegistered((err: any, registered: boolean) => {
          if (err) {
            console.error('[Pushy] Registration check failed:', err);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not check push notification status.',
            });
          } else {
            setIsRegistered(registered);
          }
          setIsLoading(false);
        });
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load Pushy SDK script.');
      toast({
        variant: 'destructive',
        title: 'Network Error',
        description: 'Failed to load Pushy SDK. Please check your internet connection and ad-blocker.',
      });
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script tag on component unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [toast]);


  return (
    <PushNotificationsCard
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
