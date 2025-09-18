"use client";

import { useState } from "react";
import { Bell, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { useApp } from "@/hooks/use-app";
import { summarizeNotifications } from "@/ai/flows/summarize-notifications";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

export function Notifications() {
  const { notifications, markNotificationsAsRead } = useApp();
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSummarize = async () => {
    setIsSummaryLoading(true);
    setSummary("");
    try {
      const notificationMessages = notifications.map(n => n.message);
      if (notificationMessages.length === 0) {
        setSummary("No notifications to summarize.");
        setIsSummaryOpen(true);
        return;
      }
      const result = await summarizeNotifications({ notifications: notificationMessages });
      setSummary(result.summary);
      setIsSummaryOpen(true);
    } catch (error) {
      console.error("Error summarizing notifications:", error);
      setSummary("Failed to generate summary. Please try again.");
      setIsSummaryOpen(true);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  return (
    <>
      <Popover onOpenChange={(open) => { if(open) markNotificationsAsRead() }}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center rounded-full p-0 text-xs">
                {unreadCount}
              </Badge>
            )}
            <span className="sr-only">Open notifications</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 md:w-96">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium">Notifications</h4>
            <Button variant="outline" size="sm" onClick={handleSummarize} disabled={isSummaryLoading || notifications.length === 0}>
              {isSummaryLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
              Summarize
            </Button>
          </div>
          <ScrollArea className="h-72">
            <div className="flex flex-col gap-4 pr-4">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <div key={notif.id} className="text-sm">
                    <p className="font-medium text-foreground">{notif.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(notif.date), { addSuffix: true })}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No new notifications.</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <AlertDialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary"/> AI Summary
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-4 text-foreground whitespace-pre-wrap">
              {summary}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
