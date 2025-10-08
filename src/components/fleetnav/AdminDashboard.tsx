
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
import Pushy from 'pushy-sdk-web';
import { sendPushyNotification } from "@/app/actions/sendPushyNotification";
import { registerAdminDevice } from "@/app/actions/registerAdminDevice";


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
        // Grant permission if not already granted
        if (!Pushy.isRegistered()) {
            const token = await Pushy.register({ appId: '6696d5e75141b712a23e53b9' });
            console.log('Pushy device token:', token);
            
            // Store the token on the backend
            const regResult = await registerAdminDevice(token);
            if (!regResult.success) {
              throw new Error(regResult.error || 'Failed to register device on backend.');
            }

            // Subscribe the user to the admin topic
            await Pushy.subscribe('admin');
            console.log('Subscribed to admin topic');

            // Send a test notification to the topic to confirm setup
            const pushResult = await sendPushyNotification({
                to: '/topics/admin',
                data: { message: "You will now receive admin alerts on this device." },
                notification: {
                    title: "Notifications Enabled",
                    body: "You will now receive admin alerts on this device.",
                },
            });

            if(!pushResult.success) {
               throw new Error(pushResult.error || 'Failed to send confirmation notification.');
            }

            toast({
                title: "Push Notifications Enabled",
                description: "You are now subscribed to admin alerts. A test notification has been sent.",
            });
        } else {
            // If already registered, we can still ensure the subscription is active
            // and the token is in our database.
            const token = Pushy.getToken();
            if(token) {
              await registerAdminDevice(token);
            }
            await Pushy.subscribe('admin');
            toast({
                title: "Notifications Re-synced",
                description: "Push notifications are active and you are subscribed to admin alerts.",
            });
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
            Enable push notifications to receive real-time alerts for important events like full taxis or new waiting list entries.
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
