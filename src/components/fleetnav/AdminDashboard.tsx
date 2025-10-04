
"use client";

import { useState } from "react";
import { Plus, Users, Shield, Bell, Loader2 } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { TaxiCard } from "./TaxiCard";
import { TaxiForm, type TaxiFormValues } from "./TaxiForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Taxi } from "@/types";
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken } from "firebase/messaging";
import { set, ref, get, push, update, remove } from "firebase/database";
import { app, db, VAPID_KEY } from "@/lib/firebase";
import { sendNotification } from "@/app/actions/sendNotification";

export function AdminDashboard() {
  const { taxis, remainingEmployees, addTaxi, editTaxi } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | undefined>(undefined);
  const { toast } = useToast();
  const [isEnabling, setIsEnabling] = useState(false);

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

  const handleEnableNotifications = async () => {
    setIsEnabling(true);
    try {
      const messaging = getMessaging(app);
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
        if (currentToken) {
          const tokensRef = ref(db, 'adminDeviceTokens');
          const snapshot = await get(tokensRef);
          const tokens: { [key: string]: string } = snapshot.val() || {};
          
          let existingKey: string | undefined;
          for (const key in tokens) {
            if (tokens[key] === currentToken) {
              existingKey = key;
              break;
            }
          }

          if (existingKey) {
            // If token exists, just show a confirmation. No need to re-add.
             toast({
              title: "Notifications Already Enabled",
              description: "This device is already registered for notifications.",
            });
            await sendNotification("Notifications Already Enabled", "You are already receiving alerts on this device.");
            setIsEnabling(false);
            return;
          }

          // If we reach here, the token is new.
          const updates: { [key: string]: any } = {};
          const tokenKeys = Object.keys(tokens);

          // Manage token list size - remove the oldest if we're at capacity
          if (tokenKeys.length >= 5) {
            const oldestKey = tokenKeys[0]; // Assuming order is maintained, which it is for push keys
            updates[`/adminDeviceTokens/${oldestKey}`] = null;
          }

          // Add the new token
          const newTokenRef = push(ref(db, 'adminDeviceTokens'));
          updates[`/adminDeviceTokens/${newTokenRef.key}`] = currentToken;
          
          await update(ref(db), updates);
          
          console.log('Admin device token saved:', currentToken);
          
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
            Use this control to manage notifications for your devices.
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

    </div>
  );
}
