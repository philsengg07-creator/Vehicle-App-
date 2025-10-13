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

export function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushyReady, setIsPushyReady] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This function will handle the entire initialization flow.
    const initialize = () => {
      // 1. Manually register the service worker.
      // This is the most robust way to ensure it's active.
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
        .then(registration => {
          console.log('Service Worker registered successfully:', registration);

          // 2. Wait for the Pushy SDK script to be loaded.
          const interval = setInterval(() => {
            if (typeof window.Pushy !== 'undefined') {
              clearInterval(interval);
              console.log('Pushy SDK is loaded.');
              setIsPushyReady(true);

              // 3. Now that the SDK is ready, check registration status.
              window.Pushy.isRegistered((err: any, registered: boolean) => {
                if (err) {
                  console.error('Pushy isRegistered check failed:', err);
                  setIsLoading(false);
                  return;
                }
                setIsRegistered(registered);
                setIsLoading(false);
                console.log('Pushy registration status:', registered);
              });
            }
          }, 100); // Check every 100ms
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
          toast({
            variant: 'destructive',
            title: 'Critical Error',
            description: 'Could not register notification service worker.',
          });
          setIsLoading(false);
        });
    };

    initialize();
  }, [toast]);


  const handleEnableNotifications = () => {
    if (!isPushyReady) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Notification service is not available. Please refresh.',
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting Pushy registration process...");
    
    window.Pushy.register().then(async (deviceToken: string) => {
      console.log('Pushy device token received:', deviceToken);
      
      const result: { success: boolean; error?: string } = await registerAdminDevice(deviceToken);

      setIsLoading(false);
      if (result.success) {
        setIsRegistered(true);
        console.log('Device token successfully registered on server.');
        toast({
          title: 'Success',
          description: 'Push notifications have been enabled for this device.',
        });
      } else {
        throw new Error(result.error || 'Server registration failed.');
      }
    }).catch((err: any) => {
      console.error('Pushy registration error:', err);
      setIsLoading(false);
      setIsRegistered(false); // Ensure UI reflects registration failure
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Could not register for notifications. Please ensure you grant permission.',
      });
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
