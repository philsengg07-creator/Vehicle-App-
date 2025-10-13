
"use client";

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { registerAdminDevice } from '@/app/actions/registerAdminDevice';

const PUSHY_APP_ID = '68e6aecbb7e2f9df7184b4df';

// Declare the Pushy object on the window for TypeScript
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

  const registerDevice = useCallback(async () => {
    setIsLoading(true);
    try {
      // Register the user for push notifications
      const deviceToken = await window.Pushy.register();
      
      // Pass the token to the server
      const result = await registerAdminDevice(deviceToken);

      if (result.success) {
        setIsRegistered(true);
        toast({
          title: 'Success',
          description: 'Push notifications enabled.',
        });
      } else {
        throw new Error(result.error || 'Server registration failed.');
      }
    } catch (err: any) {
      setIsRegistered(false);
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Could not register for notifications.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // This effect runs only on the client
    if (typeof window === 'undefined') {
      return;
    }

    const initializePushy = () => {
      // Set the App ID
      window.Pushy.setOptions({ appId: PUSHY_APP_ID });

      // Register the service worker
      navigator.serviceWorker.register('/service-worker.js')
        .then(() => {
          console.log('Pushy service worker registered.');
          
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
        .catch((err: any) => {
          console.error('Service Worker registration failed:', err);
          toast({
            variant: 'destructive',
            title: 'Critical Error',
            description: `Could not register the notification service: ${err.message}`,
          });
          setIsLoading(false);
        });
    };

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
        description: 'Could not load the notification SDK.',
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
  }, [toast]);

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
          onClick={registerDevice}
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
