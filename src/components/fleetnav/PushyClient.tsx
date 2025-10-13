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

  const waitForPushy = (): Promise<void> => {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (typeof window.Pushy !== 'undefined' && window.Pushy) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  useEffect(() => {
    const checkRegistration = async () => {
      await waitForPushy();
      
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

    checkRegistration();
  }, [toast]);

  const registerDevice = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!PUSHY_APP_ID) {
        throw new Error('Pushy App ID is not configured.');
      }
      
      await waitForPushy();

      window.Pushy.setOptions({
        serviceWorkerLocation: '/pushy-service-worker.js',
      });
      
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

  return (
    <PushNotificationsCard
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
