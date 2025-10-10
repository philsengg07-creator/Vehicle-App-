'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, Loader2 } from 'lucide-react';
import { useApp } from '@/hooks/use-app';
import { ScrollArea } from '../ui/scroll-area';
import { summarizeNotifications } from '@/ai/flows/summarize-notifications';
import { Badge } from '../ui/badge';
import { formatDistanceToNow } from 'date-fns';

export function Notifications() {
  const { notifications, markNotificationsAsRead } = useApp();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  useEffect(() => {
    if (isSheetOpen) {
      handleSummarize();
      if (unreadCount > 0) {
        // Delay marking as read to allow user to see them
        setTimeout(() => {
          markNotificationsAsRead();
        }, 2000);
      }
    }
  }, [isSheetOpen, unreadCount]);

  const handleSummarize = async () => {
    if (notifications.length === 0) {
        setSummary('No notifications to summarize.');
        return;
    }
    
    setIsSummarizing(true);
    try {
      const notificationMessages = notifications.map(n => n.message);
      const result = await summarizeNotifications({ notifications: notificationMessages });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error summarizing notifications:', error);
      setSummary('Could not summarize notifications at this time.');
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <div className="py-4">
            <div className="p-4 mb-4 bg-secondary rounded-lg">
                <h4 className="font-semibold mb-2">AI Summary</h4>
                {isSummarizing ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>Generating summary...</span>
                    </div>
                ) : (
                    <p className="text-sm text-secondary-foreground">{summary}</p>
                )}
            </div>
        </div>
        <ScrollArea className="h-[calc(100%-12rem)] pr-4">
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div key={notification.id} className={`p-3 rounded-lg transition-colors ${notification.read ? 'bg-card' : 'bg-primary/10'}`}>
                  <p className="text-sm">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(notification.date), { addSuffix: true })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No notifications yet.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
