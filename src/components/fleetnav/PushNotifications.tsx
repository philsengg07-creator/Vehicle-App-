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
    const checkPushy = () => {
      if (window.Pushy) {
        window.Pushy.setAppId(PUSHY_APP_ID);
        window.Pushy.isRegistered((err: any, registered: boolean) => {
          if (err) {
            console.error('Pushy isRegistered error:', err);
            setIsLoading(false);
            return;
          }
          setIsRegistered(registered);
          setIsLoading(false);
        });
      } else {
        setTimeout(checkPushy, 100);
      }
    };
    checkPushy();
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
    try {
      // Promisify the callback-based register function
      const deviceToken = await new Promise<string>((resolve, reject) => {
        window.Pushy.register({ serviceWorkerLocation: '/pushy-service-worker.js' }, (err: any, token: string) => {
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
        throw new Error(result.error || 'Failed to register device on the server.');
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
