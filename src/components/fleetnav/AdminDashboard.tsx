
"use client";

import { useState } from "react";
import { Plus, Users, Shield, Bell, DatabaseZap, Loader2 } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { TaxiCard } from "./TaxiCard";
import { TaxiForm, type TaxiFormValues } from "./TaxiForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Taxi } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken } from "firebase/messaging";
import { set, ref } from "firebase/database";
import { app, db, VAPID_KEY } from "@/lib/firebase";
import { sendNotification } from "@/app/actions/sendNotification";


async function resetData() {
  try {
    const response = await fetch('/api/reset-data', {
      method: 'POST',
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to reset data');
    }
    return await response.json();
  } catch (error) {
    console.error('Error resetting data:', error);
    throw error;
  }
}

export function AdminDashboard() {
  const { taxis, remainingEmployees, addTaxi, editTaxi } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | undefined>(undefined);
  const { toast } = useToast();
  const [isResetting, setIsResetting] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleOpenForm = (taxi?: Taxi) => {
    setEditingTaxi(taxi);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTaxi(undefined);
  };

  const handleSubmit = (data: TaxiFormValues) => {
    if (editingTaxi) {
      editTaxi(editingTaxi.id, data);
    } else {
      addTaxi(data);
    }
    handleCloseForm();
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetData();
      toast({
        title: 'Success',
        description: 'Database has been reset to its initial state.',
      });
      // Optionally, you might want to refresh the page or state
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to reset database.',
      });
    } finally {
      setIsResetting(false);
      setIsAlertOpen(false);
    }
  };

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
          const tokenRef = ref(db, 'adminDeviceToken');
          await set(tokenRef, currentToken);
          console.log('Admin device token saved:', currentToken);
          
          // Automatically send a test notification
          await sendNotification("Notifications Enabled", "You will now receive alerts on this device.");

          toast({
            title: "Push Notifications Enabled",
            description: "A test notification has been sent to this device.",
          });
        } else {
          throw new Error("Could not get push token. Please check your browser settings.");
        }
      } else {
        throw new Error("Permission denied. You have not granted permission for notifications.");
      }
    } catch (error: any) {
      console.error('An error occurred while enabling notifications.', error);
      toast({
        variant: "destructive",
        title: "Notification Setup Failed",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsEnabling(false);
    }
  };

  return (
    <div className="py-8">
       <Card className="my-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield /> Admin Controls
          </CardTitle>
          <CardDescription>
            Use these controls to manage notifications and app data.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <Button onClick={handleEnableNotifications} disabled={isEnabling} className='w-full sm:w-auto'>
            {isEnabling ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Bell/>
            )}
            Enable Notifications
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsAlertOpen(true)}
            disabled={isResetting}
            className='w-full sm:w-auto'
          >
            {isResetting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <DatabaseZap />
            )}
            Reset App Data
          </Button>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold font-headline">Taxi Fleet</h2>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Taxi
            </Button>
          </div>
          
          {taxis.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {taxis.map((taxi) => (
                <TaxiCard key={taxi.id} taxi={taxi} onEdit={handleOpenForm} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
               <h3 className="text-lg font-semibold">No Taxis Found</h3>
               <p className="text-muted-foreground mt-1">Add a new taxi to get started.</p>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                  <Users />
                  Waiting List
              </CardTitle>
            </CardHeader>
            <CardContent>
              {remainingEmployees.length > 0 ? (
                <ul className="space-y-2">
                  {remainingEmployees.map((employee, index) => (
                    <li key={index} className="flex items-center text-sm p-3 bg-secondary rounded-md font-medium">
                      {`Employee ${employee}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">The waiting list is empty.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => {
            e.preventDefault();
          }}>
            <DialogHeader>
              <DialogTitle>{editingTaxi ? "Edit Taxi" : "Add New Taxi"}</DialogTitle>
            </DialogHeader>
            <TaxiForm onSubmit={handleSubmit} onClose={handleCloseForm} taxi={editingTaxi}/>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all taxis, bookings, and
              notifications from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Yes, reset data
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
