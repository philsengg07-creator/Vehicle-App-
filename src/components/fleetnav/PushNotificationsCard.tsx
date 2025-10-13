"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Loader2 } from 'lucide-react';

interface PushNotificationsCardProps {
  isLoading: boolean;
  isRegistered: boolean;
  onRegister: () => void;
}

export function PushNotificationsCard({ isLoading, isRegistered, onRegister }: PushNotificationsCardProps) {
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
          onClick={onRegister}
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
