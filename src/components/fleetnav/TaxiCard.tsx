"use client";

import { useState } from "react";
import { Users, Edit, Trash2, CheckCircle, Car } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import type { Taxi } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface TaxiCardProps {
  taxi: Taxi;
  onEdit: (taxi: Taxi) => void;
}

export function TaxiCard({ taxi, onEdit }: TaxiCardProps) {
  const { role, bookSeat, deleteTaxi, currentEmployeeId } = useApp();
  
  const isFull = taxi.bookedSeats >= taxi.capacity;
  const progressValue = (taxi.bookedSeats / taxi.capacity) * 100;
  const isBookedByCurrentUser = taxi.bookings.some(b => b.employeeId === currentEmployeeId);

  const handleBookClick = () => {
    bookSeat(taxi.id);
  };

  const handleDeleteClick = () => {
    deleteTaxi(taxi.id);
  };

  const AdminCardContent = () => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col h-full cursor-pointer">
          <CardHeader className="flex-row justify-between items-start">
            <CardTitle className="font-headline text-xl">{taxi.name}</CardTitle>
            {isFull && <Badge variant="destructive" className="shadow-lg">Full</Badge>}
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>Capacity</span>
                    </div>
                    <span className="font-medium text-foreground">{taxi.bookedSeats} / {taxi.capacity}</span>
                </div>
                <Progress value={progressValue} aria-label={`${taxi.bookedSeats} of ${taxi.capacity} seats booked`} />
            </div>
          </CardContent>
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bookings for {taxi.name}</DialogTitle>
        </DialogHeader>
        {taxi.bookings.length > 0 ? (
          <ul className="space-y-2 pt-4">
            {taxi.bookings.map((booking) => (
              <li key={booking.id} className="flex items-center text-sm p-3 bg-secondary rounded-md font-medium">
                {booking.employeeId}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No employees have booked this taxi yet.</p>
        )}
      </DialogContent>
    </Dialog>
  );

  const EmployeeCardContent = () => (
    <>
      <CardHeader className="flex-row justify-between items-start">
        <CardTitle className="font-headline text-xl">{taxi.name}</CardTitle>
        {isFull && <Badge variant="destructive" className="shadow-lg">Full</Badge>}
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Capacity</span>
                </div>
                {role === 'admin' || isFull ? (
                  <span className="font-medium text-foreground">{taxi.bookedSeats} / {taxi.capacity}</span>
                ) : null }
            </div>
            <Progress value={progressValue} aria-label={`${taxi.bookedSeats} of ${taxi.capacity} seats booked`} />
        </div>
      </CardContent>
    </>
  );

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg animate-in fade-in-0 zoom-in-95">
      {role === 'admin' ? <AdminCardContent /> : <EmployeeCardContent />}
      <CardFooter className="p-4 bg-card-foreground/5">
        {role === "admin" ? (
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(taxi)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the taxi "{taxi.name}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClick}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <Button
            onClick={handleBookClick}
            disabled={isBookedByCurrentUser}
            className="w-full transition-all"
            variant={isBookedByCurrentUser ? "secondary" : "default"}
          >
            {isBookedByCurrentUser ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Booked
              </>
            ) : isFull ? (
                <>
                    <Car className="mr-2 h-4 w-4"/>
                    Join Waiting List
                </>
            ) : (
                <>
                    <Car className="mr-2 h-4 w-4"/>
                    Book a Seat
                </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
