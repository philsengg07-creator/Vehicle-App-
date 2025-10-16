"use client";

import { useState } from "react";
import { Plus, Users } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import { TaxiCard } from "./TaxiCard";
import { TaxiForm, type TaxiFormValues } from "./TaxiForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { Taxi } from "@/types";
import { registerAdminDevice } from "@/app/actions/registerAdminDevice";
import { useToast } from "@/hooks/use-toast";
import { PushyInitializer } from "@/components/PushyInitializer";

export function AdminDashboard() {
  const { taxis, remainingEmployees, addTaxi, editTaxi } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaxi, setEditingTaxi] = useState<Taxi | undefined>(undefined);
  const { toast } = useToast();

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

  const enableNotifications = () => {
    if (typeof window !== "undefined" && "Pushy" in window) {
      const Pushy = (window as any).Pushy;
      Pushy.register()
        .then(async (deviceToken: string) => {
          console.log("Pushy device token:", deviceToken);
          await registerAdminDevice(deviceToken);
          toast({
            title: "Success",
            description: "Push notifications enabled for this device.",
          });
        })
        .catch((err: Error) => {
          console.error("Pushy registration failed:", err);
          toast({
            variant: "destructive",
            title: "Registration Failed",
            description: err.message,
          });
        });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Pushy SDK not loaded yet. Please try again in a moment.",
      });
    }
  };

  return (
    <>
      <PushyInitializer />
      <div className="py-8">
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
          
          <div className="lg:col-span-1 space-y-8">
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
            
            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <Button className="w-full" onClick={enableNotifications}>
                  Enable Notifications
                </Button>
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
    </>
  );
}
