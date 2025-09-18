// src/components/fleetnav/PushNotifications.tsx
"use client";

import { useEffect, useState } from 'react';
import { messaging, VAPID_KEY } from '@/lib/firebase';
import { getToken } from 'firebase/messaging';
import { useToast } from '@/hooks/use-toast';
import { storeAdminDeviceToken } from '@/ai/flows/store-admin-device-token';
import { Button } from '../ui/button';
import { BellRing } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

export function PushNotifications() {
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!messaging) {
      toast({
        variant: "destructive",
        title: "Messaging not supported",
        description: "Push notifications are not supported in this browser."
      });
      return;
    }
    
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        console.log('Notification permission granted.');
        
        await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        
        const currentToken = await getToken(messaging, { 
          vapidKey: VAPID_KEY,
        });

        if (currentToken) {
          console.log('FCM Token:', currentToken);
          await storeAdminDeviceToken({ token: currentToken });
          console.log('Admin device token stored on server.');
          toast({
            title: "Notifications Enabled",
            description: "You will now receive push notifications on this device."
          });
        } else {
          console.log('No registration token available. Request permission to generate one.');
          toast({
            variant: "destructive",
            title: "Could not get token",
            description: "Failed to retrieve notification token. Please try again."
          });
        }
      } else {
        console.log('Unable to get permission to notify.');
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You will not receive notifications without granting permission."
        });
      }
    } catch (err) {
      console.error('An error occurred while handling notifications.', err);
      let description = "An unknown error occurred.";
      if (err instanceof Error) {
        description = err.message;
      }
      toast({
        variant: "destructive",
        title: "Error setting up notifications",
        description,
      });
    }
  };

  if (permission === 'granted') {
    return (
        <Card className="bg-accent/50 border-accent">
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <BellRing className="text-accent" />
                    Notifications Enabled
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className='text-sm text-accent-foreground'>This device is set up to receive push notifications for important admin alerts.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Enable Push Notifications</CardTitle>
            <CardDescription>Get real-time alerts for taxi fleet updates, even when the app is in the background.</CardDescription>
        </CardHeader>
        <CardContent>
            <Button onClick={requestNotificationPermission} className='w-full'>
                <BellRing className='mr-2' /> Enable Notifications
            </Button>
            {permission === 'denied' && (
                <p className='text-xs text-destructive text-center pt-4'>
                    Notification permission was denied. You need to enable it in your browser settings.
                </p>
            )}
        </CardContent>
    </Card>
  );
}
