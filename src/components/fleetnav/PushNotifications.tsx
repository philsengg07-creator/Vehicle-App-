
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
  const { toast } = useToast();

  const PUSHY_APP_ID = '68e6aecbb7e2f9df7184b4df';

  useEffect(() => {
    // Function to check for Pushy and then check registration
    const initializePushy = () => {
      if (window.Pushy) {
        console.log('Pushy SDK found.');
        // No need to create an instance here, just check registration
        window.Pushy.isRegistered((err: any, registered: boolean) => {
          setIsLoading(false);
          if (err) {
            console.error('Pushy isRegistered check failed:', err);
            return;
          }
          console.log('Pushy registered status:', registered);
          setIsRegistered(registered);
        });
      } else {
        // If Pushy isn't loaded, wait and try again
        console.log('Pushy SDK not found, retrying...');
        setTimeout(initializePushy, 100);
      }
    };
    initializePushy();
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
      // Create a new Pushy instance with your App ID
      const pushy = new window.Pushy(PUSHY_APP_ID);
      
      // Use a promise to handle the callback-based registration
      const deviceToken = await new Promise<string>((resolve, reject) => {
        pushy.register((err: any, token: string) => {
          if (err) {
            console.error('Pushy registration failed inside callback:', err);
            return reject(err);
          }
          if (!token) {
            console.error('Pushy registration failed: No token received.');
            return reject(new Error("Pushy registration failed: No token received."));
          }
          console.log('Pushy device token received:', token);
          resolve(token);
        });
      });
      
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
    } catch (error: any) {
      console.error('Full Pushy registration error:', error);
      let errorMessage = 'An unknown error occurred during registration.';
      if (error && error.message) {
        errorMessage = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Notification Setup Failed',
        description: errorMessage,
      });
      setIsRegistered(false);
    } finally {
      setIsLoading(false);
      console.log('Notification registration process finished.');
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
