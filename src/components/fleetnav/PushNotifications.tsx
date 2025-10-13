"use client";

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    // This function runs only on the client side.
    const initialize = async () => {
      // 1. Ensure Service Workers are supported by the browser
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

      // 2. Manually register our service worker file
      try {
        await navigator.serviceWorker.register('/service-worker.js');
        console.log('Service Worker registered successfully.');
      } catch (error: any) {
        console.error('Service Worker registration failed:', error);
        toast({
          variant: 'destructive',
          title: 'Critical Error',
          description: `Could not register the notification service: ${error.message}`,
        });
        setIsLoading(false);
        return;
      }

      // 3. Wait for the Pushy SDK script (loaded in layout.tsx) to be ready.
      const interval = setInterval(() => {
        if (typeof window.Pushy !== 'undefined') {
          clearInterval(interval);
          console.log('Pushy SDK is loaded.');

          try {
            // 4. Configure Pushy with your App ID
            window.Pushy.setAppId(PUSHY_APP_ID);
            console.log('Pushy App ID set.');

            // 5. Now that everything is set up, check if the device is already registered.
            window.Pushy.isRegistered((err: any, registered: boolean) => {
              if (err) {
                console.error('Pushy isRegistered check failed:', err);
              } else {
                setIsRegistered(registered);
              }
              // Final state updates
              setIsPushyReady(true);
              setIsLoading(false);
            });
          } catch (e: any) {
            console.error('Failed during Pushy initialization:', e);
            toast({
              variant: 'destructive',
              title: 'Initialization Error',
              description: `Pushy SDK could not be configured: ${e.message}`,
            });
            setIsLoading(false);
          }
        }
      }, 100);
    };

    initialize();
  }, [toast]);

  const handleEnableNotifications = () => {
    if (!isPushyReady) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Notification service is not available yet. Please wait a moment.',
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
