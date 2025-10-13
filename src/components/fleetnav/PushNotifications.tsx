"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { registerAdminDevice } from '@/app/actions/registerAdminDevice';

declare global {
  interface Window {
    Pushy: any;
  }
}

const PUSHY_APP_ID = '68e6aecbb7e2f9df7184b4df';

export function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushyReady, setIsPushyReady] = useState(false);
  const { toast } = useToast();

  const initializePushy = useCallback(() => {
    if (!('serviceWorker' in navigator)) {
      console.error('Service workers are not supported by this browser.');
      toast({
        variant: 'destructive',
        title: 'Browser Not Supported',
        description: 'This browser does not support push notifications.',
      });
      setIsLoading(false);
      return;
    }

    navigator.serviceWorker.register('/service-worker.js')
      .then(() => {
        console.log('Service Worker registered successfully.');

        // Set App ID
        window.Pushy.setAppId(PUSHY_APP_ID);

        // Check registration status
        window.Pushy.isRegistered((err: any, registered: boolean) => {
          if (err) {
            console.error('Pushy isRegistered check failed:', err);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: 'Could not check notification status.',
            });
            setIsLoading(false);
            return;
          }
          setIsRegistered(registered);
          setIsPushyReady(true);
          setIsLoading(false);
        });
      })
      .catch((error: any) => {
        console.error('Service Worker registration failed:', error);
        toast({
          variant: 'destructive',
          title: 'Critical Error',
          description: `Could not register the notification service: ${error.message}`,
        });
        setIsLoading(false);
      });
  }, [toast]);

  useEffect(() => {
    // If Pushy is already loaded, initialize it.
    if (window.Pushy) {
      initializePushy();
      return;
    }

    // Otherwise, dynamically load the Pushy script.
    const script = document.createElement('script');
    script.src = 'https://sdk.pushy.me/web/1.0.10/pushy-sdk.js';
    script.async = true;

    // When the script loads, initialize Pushy.
    script.onload = initializePushy;
    
    script.onerror = () => {
        console.error('Failed to load Pushy SDK script.');
        toast({
            variant: 'destructive',
            title: 'Network Error',
            description: 'Could not load the notification SDK. Please check your connection.',
        });
        setIsLoading(false);
    };

    document.head.appendChild(script);

    // Cleanup function to remove the script if the component unmounts.
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [initializePushy, toast]);

  const handleEnableNotifications = () => {
    if (!isPushyReady) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Notification service is not available yet. Please wait.',
      });
      return;
    }

    setIsLoading(true);
    
    window.Pushy.register().then(async (deviceToken: string) => {
      const result: { success: boolean; error?: string } = await registerAdminDevice(deviceToken);

      if (result.success) {
        setIsRegistered(true);
        toast({
          title: 'Success',
          description: 'Push notifications have been enabled for this device.',
        });
      } else {
        throw new Error(result.error || 'Server registration failed.');
      }
    }).catch((err: any) => {
      setIsRegistered(false);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Could not register for notifications. Please ensure you grant permission.',
      });
    }).finally(() => {
      setIsLoading(false);
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <BellRing />
            Push Notifications
        </CardTitle>
        <CardDescription>
            {isRegistered ? 'Notifications are enabled for this device.' : 'Enable push notifications to receive real-time updates.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          className="w-full"
          onClick={handleEnableNotifications}
          disabled={isLoading || isRegistered || !isPushyReady}
        >
          {isLoading ? (
            <Loader2 className="animate-spin" />
          ) : isRegistered ? (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Enabled
            </>
          ) : (
            <>
              <Bell className="mr-2 h-4 w-4" />
              Enable Notifications
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
