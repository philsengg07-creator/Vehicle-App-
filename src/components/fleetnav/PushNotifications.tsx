'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { registerAdminDevice } from '@/app/actions/registerAdminDevice';

export function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pushy, setPushy] = useState<any>(null);
  const { toast } = useToast();

  const checkRegistrationStatus = useCallback(async () => {
    if ((window as any).Pushy) {
      const pushyInstance = new (window as any).Pushy({ appId: '6696d5e75141b712a23e53b9' });
      setPushy(pushyInstance);
      const registered = await pushyInstance.isRegistered();
      setIsRegistered(registered);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const registerServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered successfully.');
          // Now that SW is registered, check Pushy registration
          const interval = setInterval(() => {
            if ((window as any).Pushy) {
              clearInterval(interval);
              checkRegistrationStatus();
            }
          }, 100);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
          toast({
            variant: 'destructive',
            title: 'Service Worker Error',
            description: `Registration failed: ${(error as Error).message}`,
          });
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        toast({
          variant: 'destructive',
          title: 'Unsupported Browser',
          description: 'Push notifications are not supported in this browser.',
        });
      }
    };

    registerServiceWorker();

  }, [toast, checkRegistrationStatus]);

  const handleEnableNotifications = async () => {
    if (!pushy) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Notification service is not available. Please refresh the page.',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const deviceToken = await pushy.register();
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
