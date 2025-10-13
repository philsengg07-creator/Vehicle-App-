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
    setIsLoading(true);
    try {
      if (!window.Pushy) {
        throw new Error('Pushy SDK not loaded.');
      }
      
      const deviceToken = await new Promise<string>((resolve, reject) => {
        window.Pushy.register({ appId: PUSHY_APP_ID }).then((token: string) => {
          resolve(token);
        }).catch((err: any) => {
          reject(err);
        });
      });
      
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
    if (typeof window === 'undefined') {
        return;
    }

    const checkRegistration = () => {
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
    };
    
    // If Pushy is already loaded, check registration
    if (window.Pushy) {
        checkRegistration();
        return;
    }

    // Otherwise, load it
    const script = document.createElement('script');
    script.src = 'https://sdk.pushy.me/web/pushy-sdk.js';
    script.crossOrigin = 'anonymous';
    script.async = true;

    script.onload = () => {
      // Set options after script has loaded
      if (window.Pushy) {
        window.Pushy.setOptions({
          serviceWorkerLocation: '/pushy-service-worker.js',
        });
        checkRegistration();
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
      document.head.removeChild(script);
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
