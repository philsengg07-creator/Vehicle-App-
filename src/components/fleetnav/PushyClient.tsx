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
    if (!('serviceWorker' in navigator)) {
        toast({
            variant: 'destructive',
            title: 'Unsupported Browser',
            description: 'Push notifications are not supported in this browser.',
        });
        return;
    }
    
    setIsLoading(true);

    try {
        const registration = await navigator.serviceWorker.register('/service-worker.js?appId=' + PUSHY_APP_ID);
        
        await navigator.serviceWorker.ready;

        const deviceToken = await new Promise((resolve, reject) => {
            const messageChannel = new MessageChannel();
            messageChannel.port1.onmessage = (event) => {
                if (event.data.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data.deviceToken);
                }
            };
            if(registration.active) {
                registration.active.postMessage({ type: 'GET_DEVICE_TOKEN' }, [messageChannel.port2]);
            } else {
                reject(new Error("Service worker is not active."));
            }
        });

        if (!deviceToken) {
            throw new Error('Failed to get device token from service worker.');
        }

        const result = await registerAdminDevice(deviceToken as string);

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
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration().then(registration => {
            if (registration && registration.active) {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = (event) => {
                    if (event.data && event.data.isRegistered) {
                        setIsRegistered(true);
                    }
                    setIsLoading(false);
                };
                registration.active.postMessage({ type: 'IS_REGISTERED' }, [messageChannel.port2]);
            } else {
                setIsRegistered(false);
                setIsLoading(false);
            }
        });
    } else {
        setIsLoading(false);
    }
  }, []);


  return (
    <PushNotificationsCard
      isLoading={isLoading}
      isRegistered={isRegistered}
      onRegister={registerDevice}
    />
  );
}
