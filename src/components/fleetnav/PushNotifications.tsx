"use client";

import { useEffect, useState, useRef } from 'react';
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
  const { toast } = useToast();
  const pushyInitialized = useRef(false);

  const PUSHY_APP_ID = '68e6aecbb7e2f9df7184b4df';

  useEffect(() => {
    if (pushyInitialized.current || !window.Pushy) {
        return;
    }
    pushyInitialized.current = true;
    
    console.log('Pushy SDK found.');
    window.Pushy.isRegistered((err: any, registered: boolean) => {
      setIsLoading(false);
      if (err) {
        console.error('Pushy isRegistered check failed:', err);
        return;
      }
      console.log('Pushy registered status:', registered);
      setIsRegistered(registered);
    });

  }, []);

  const handleEnableNotifications = async () => {
    if (!window.Pushy) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Notification service is not available. Please refresh the page.',
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting notification registration process...');
    
    try {
      // The Pushy object is not a constructor when loaded from CDN
      // The App ID is configured in the service worker.
      // We directly call register on the global window.Pushy object.
      window.Pushy.register({ appId: PUSHY_APP_ID }, async (err: any, deviceToken: string) => {
        if (err) {
          console.error('Pushy registration failed inside callback:', err);
          toast({
            variant: 'destructive',
            title: 'Notification Setup Failed',
            description: err.message || 'An unknown error occurred during registration.',
          });
          setIsRegistered(false);
          setIsLoading(false);
          return;
        }

        if (!deviceToken) {
           console.error('Pushy registration failed: No token received.');
           toast({
            variant: 'destructive',
            title: 'Notification Setup Failed',
            description: "Pushy registration failed: No token received.",
          });
          setIsRegistered(false);
          setIsLoading(false);
          return;
        }

        console.log('Pushy device token received:', deviceToken);
        
        console.log('Registering device token with the server...');
        const result = await registerAdminDevice(deviceToken);

        if (result.success) {
          setIsRegistered(true);
          console.log('Device token successfully registered on server.');
          toast({
            title: 'Success',
            description: 'Push notifications have been enabled for this device.',
          });
        } else {
          throw new Error(result.error || 'Failed to register device on the server.');
        }

        setIsLoading(false);
        console.log('Notification registration process finished.');
      });
    } catch (error: any) {
      console.error('Full Pushy registration error:', error);
      toast({
        variant: 'destructive',
        title: 'Notification Setup Failed',
        description: error.message || 'An unknown error occurred.',
      });
      setIsRegistered(false);
      setIsLoading(false);
    }
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
          disabled={isLoading || isRegistered}
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
