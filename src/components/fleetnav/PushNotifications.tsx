"use client";

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

const PushyClient = dynamic(() => import('./PushyClient'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-6">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  ),
});

export function PushNotifications() {
  return <PushyClient />;
}
