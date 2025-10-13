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
    

    // Wait for the Pushy SDK to be loaded by the script tag in layout.tsx
    const intervalId = setInterval(() => {
      if (window.Pushy) {
        clearInterval(intervalId);
        console.log('Pushy SDK found.');
        pushyInitialized.current = true;
        
        window.Pushy.isRegistered((err: any, registered: boolean) => {
          setIsLoading(false);
          if (err) {
            console.error('Pushy isRegistered check failed:', err);
            return;
          }
          setIsRegistered(registered);
        });
      }
    }, 100); // Check for Pushy every 100ms

    return () => clearInterval(intervalId);
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
    console.log('Starting notification registration process...');
    
    // Register the user for push notifications
    window.Pushy.register((err: any, deviceToken: string) => {
        // Handle registration errors
        if (err) {
            console.error('Pushy registration failed:', err);
            toast({
                variant: 'destructive',
                title: 'Notification Setup Failed',
                description: err.message || 'An unknown error occurred during registration.',
            });
            setIsRegistered(false);
            setIsLoading(false);
            return;
        }

        // Check if a token was received
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
        console.log("Registering token on the server...");
        
        // Asynchronously send the token to the server
        registerAdminDevice(deviceToken).then(result => {
            if (result.success) {
                setIsRegistered(true);
                console.log('Device token successfully registered on server.');
                toast({
                    title: 'Success',
                    description: 'Push notifications have been enabled for this device.',
                });
            } else {
                // If the server fails to save the token, we are not truly registered.
                setIsRegistered(false);
                throw new Error(result.error || 'Failed to register device on the server.');
            }
        }).catch(serverError => {
            console.error('Server registration error:', serverError);
            toast({
                variant: 'destructive',
                title: 'Server Registration Failed',
                description: serverError.message || 'Could not save device token.',
            });
             setIsRegistered(false);
        }).finally(() => {
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
