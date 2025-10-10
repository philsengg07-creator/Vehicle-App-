'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { registerAdminDevice } from '@/app/actions/registerAdminDevice';

// Define Pushy on the window object for TypeScript
declare global {
  interface Window {
    Pushy: any;
  }
}

export function PushNotifications() {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [pushy, setPushy] = useState<any>(null);

  useEffect(() => {
    // Function to check for Pushy and initialize
    const initializePushy = () => {
      if (window.Pushy) {
        try {
          // Initialize Pushy with your app ID
          const pushyInstance = new window.Pushy({ appId: '6696d5e75141b712a23e53b9' });
          setPushy(pushyInstance);

          // Check if already registered
          pushyInstance.isRegistered().then((registered: boolean) => {
            setIsRegistered(registered);
            setIsLoading(false);
          });
        } catch (err) {
          console.error("Failed to instantiate Pushy:", err);
          setIsLoading(false);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to initialize notification service.',
          });
        }
      } else {
        // If Pushy SDK is not loaded yet, wait and retry
        setTimeout(initializePushy, 100);
      }
    };
    
    // Start the check
    initializePushy();

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => console.log('Service Worker registered with scope:', registration.scope))
        .catch(error => console.error('Service Worker registration failed:', error));
    }
  }, [toast]);

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
      // Register the device for push notifications
      const deviceToken = await pushy.register();
      // Save the device token to your backend
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
