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

  useEffect(() => {
    if (pushyInitialized.current || typeof window === 'undefined') return;

    const initializePushy = () => {
      if (pushyInitialized.current) return;
      pushyInitialized.current = true;

      console.log("Pushy SDK found, proceeding with initialization.");

      window.Pushy.isRegistered((err: any, registered: boolean) => {
        setIsLoading(false);
        if (err) {
          console.error("Pushy isRegistered check failed:", err);
          return;
        }
        setIsRegistered(registered);
        console.log("Pushy registration status:", registered);
      });
    };

    const interval = setInterval(() => {
      if (typeof window.Pushy !== 'undefined') {
        clearInterval(interval);
        initializePushy();
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = () => {
    if (!window.Pushy) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Notification service is not available. Please refresh the page.',
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting notification registration process...");
    
    // Register the user for push notifications
    window.Pushy.register().then((deviceToken: string) => {
      console.log('Pushy device token received:', deviceToken);
      console.log("Registering token on the server...");

      // Call your server-side action to store the token
      return registerAdminDevice(deviceToken);
    }).then(result => {
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
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: err.message || 'Could not register for notifications.',
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
