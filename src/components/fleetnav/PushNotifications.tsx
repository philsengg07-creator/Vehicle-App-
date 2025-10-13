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
    // Manually register the service worker first.
    // This is the most critical step to ensure it's active.
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered successfully:', registration);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
          toast({
            variant: 'destructive',
            title: 'Critical Error',
            description: 'Could not register notification service worker.',
          });
          setIsLoading(false);
        }
      }
    };

    const initializePushy = () => {
      // Listen for the Pushy SDK to be ready
      window.Pushy.ready((err: any) => {
        if (err) {
          console.error('Pushy SDK failed to load:', err);
          toast({
            variant: 'destructive',
            title: 'SDK Error',
            description: 'Notification service failed to load.',
          });
          setIsLoading(false);
          return;
        }

        console.log('Pushy SDK is loaded and ready.');
        setIsPushyReady(true);

        // Now that SDK is ready, check the registration status
        window.Pushy.isRegistered((err: any, registered: boolean) => {
          setIsLoading(false);
          if (err) {
            console.error('Pushy isRegistered check failed:', err);
            return;
          }
          setIsRegistered(registered);
          console.log('Pushy registration status:', registered);
        });
      });
    };

    registerServiceWorker().then(() => {
        // Now that the SW is being registered, load Pushy logic.
        if (typeof window.Pushy !== 'undefined') {
            initializePushy();
        } else {
            // Fallback if the script hasn't loaded yet
            const script = document.querySelector('script[src="https://sdk.pushy.me/web/1.0.10/pushy-sdk.js"]');
            script?.addEventListener('load', initializePushy);
        }
    });

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
    
    window.Pushy.register().then((deviceToken: string) => {
      console.log('Pushy device token received:', deviceToken);
      console.log("Registering token on the server...");
      return registerAdminDevice(deviceToken);
    }).then((result: { success: boolean; error?: string }) => {
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
