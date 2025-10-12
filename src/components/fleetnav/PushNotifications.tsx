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

export function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const PUSHY_APP_ID = '68e6aecbb7e2f9df7184b4df';

  useEffect(() => {
    const initializePushy = () => {
      // Check if Pushy is loaded
      if (window.Pushy) {
        // Set the app ID
        window.Pushy.setAppId(PUSHY_APP_ID);

        // Check registration status
        window.Pushy.isRegistered((err: any, registered: boolean) => {
          if (err) {
            console.error('Pushy isRegistered error:', err);
            toast({
              variant: 'destructive',
              title: 'Pushy Error',
              description: err.message || 'Failed to check registration status.',
            });
            setIsLoading(false);
            return;
          }
          setIsRegistered(registered);
          setIsLoading(false);
        });
      } else {
        // If Pushy not loaded, wait and try again
        setTimeout(initializePushy, 100);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered successfully with scope:', registration.scope);
          initializePushy();
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
          toast({
            variant: 'destructive',
            title: 'Service Worker Error',
            description: `Registration failed: ${(error as Error).message}`,
          });
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
      toast({
        variant: 'destructive',
        title: 'Unsupported Browser',
        description: 'Push notifications are not supported in this browser.',
      });
    }
  }, [toast]);


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
    try {
      const deviceToken = await new Promise<string>((resolve, reject) => {
        window.Pushy.register((err: any, token: string) => {
          if (err) {
            return reject(err);
          }
          resolve(token);
        });
      });
      
      const result = await registerAdminDevice(deviceToken);

      if (result.success) {
        setIsRegistered(true);
        toast({
          title: 'Success',
          description: 'Push notifications have been enabled for this device.',
        });
      } else {
        throw new Error(result.error || 'Failed to register device.');
      }
    } catch (error: any) {
      console.error('Pushy registration error:', error);
      let errorMessage = 'An unknown error occurred.';
      if (error.message) {
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
