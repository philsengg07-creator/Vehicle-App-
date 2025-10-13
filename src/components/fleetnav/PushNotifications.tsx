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
    // Prevent re-initialization on re-renders
    if (pushyInitialized.current) {
        setIsLoading(false);
        return;
    };

    const initPushy = () => {
      console.log("Pushy SDK Initializing...");
      pushyInitialized.current = true;
      
      // Check if already registered
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
    
    // Wait until Pushy SDK script loads
    if (typeof window.Pushy === 'undefined') {
      console.log("Pushy SDK not loaded yet, waiting...");
      const interval = setInterval(() => {
        if (window.Pushy) {
          clearInterval(interval);
          console.log("Pushy SDK found.");
          initPushy();
        }
      }, 500);
      return () => clearInterval(interval);
    } else {
      console.log("Pushy SDK already loaded.");
      initPushy();
    }
  }, []); // Empty dependency array to run only once on mount

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
    
    window.Pushy.register((err: any, deviceToken: string) => {
      if (err) {
        console.error('Pushy registration error:', err);
        toast({
          variant: 'destructive',
          title: 'Registration Failed',
          description: err.message || 'Could not register for notifications.',
        });
        setIsLoading(false);
        return;
      }

      console.log('Pushy device token received:', deviceToken);
      console.log("Registering token on the server...");

      registerAdminDevice(deviceToken)
        .then(result => {
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
        })
        .catch(serverError => {
          console.error('Server registration error:', serverError);
          setIsRegistered(false); // Rollback state
          toast({
            variant: 'destructive',
            title: 'Server Error',
            description: serverError.message || 'Could not save device token.',
          });
        })
        .finally(() => {
          setIsLoading(false);
          console.log('Notification registration process finished.');
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
