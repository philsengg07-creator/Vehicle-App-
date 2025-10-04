
"use client";

import { useState } from "react";
import { Users, Edit, Trash2, CheckCircle, Car, Clock } from "lucide-react";
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

function formatTimeToAMPM(time: string) {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    const formattedMinutes = minutes.toString().padStart(2, '0');
    return `${formattedHours}:${formattedMinutes} ${ampm}`;
}

export function TaxiCard({ taxi, onEdit }: TaxiCardProps) {
  const { role, bookSeat, deleteTaxi, currentEmployeeId } = useApp();
  
  const isFull = taxi.bookedSeats >= taxi.capacity;
  const progressValue = (taxi.bookedSeats / taxi.capacity) * 100;
  const isBookedByCurrentUser = taxi.bookings.some(b => b.employeeId === currentEmployeeId);
  
  const now = new Date();
  const deadlineDate = new Date();
  if (taxi.bookingDeadline) {
    const [hours, minutes] = taxi.bookingDeadline.split(':').map(Number);
    deadlineDate.setHours(hours, minutes, 0, 0);
  }
  const bookingDeadlinePassed = taxi.bookingDeadline ? now > deadlineDate : false;

  const handleDeleteClick = () => {
    deleteTaxi(taxi.id);
  };

  const handleBookClick = () => {
    bookSeat(taxi.id);
  };

  const AdminCardContent = () => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex flex-col h-full cursor-pointer">
          <CardHeader className="flex-row justify-between items-start">
            <CardTitle className="font-headline text-xl">{taxi.name}</CardTitle>
            <div className="flex flex-col items-end gap-2">
              {isFull && <Badge variant="destructive" className="shadow-lg">Full</Badge>}
              {bookingDeadlinePassed && !isFull && <Badge variant="secondary" className="shadow-lg">Booking Closed</Badge>}
            </div>
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
                {taxi.bookingDeadline && (
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                      <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Booking Closes</span>
                      </div>
                      <span className="font-medium text-foreground">{formatTimeToAMPM(taxi.bookingDeadline)}</span>
                  </div>
                )}
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
        <div className="flex flex-col items-end gap-2">
            {isFull && <Badge variant="destructive" className="shadow-lg">Full</Badge>}
            {bookingDeadlinePassed && !isFull && <Badge variant="secondary" className="shadow-lg">Booking Closed</Badge>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>Capacity</span>
                </div>
                {role === 'admin' || isFull || bookingDeadlinePassed ? (
                  <span className="font-medium text-foreground">{taxi.bookedSeats} / {taxi.capacity}</span>
                ) : null }
            </div>
            <Progress value={progressValue} aria-label={`${taxi.bookedSeats} of ${taxi.capacity} seats booked`} />
             {taxi.bookingDeadline && (
                <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Booking Closes</span>
                    </div>
                    <span className="font-medium text-foreground">{formatTimeToAMPM(taxi.bookingDeadline)}</span>
                </div>
            )}
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
            disabled={isBookedByCurrentUser || bookingDeadlinePassed}
            className="w-full transition-all"
            variant={isBookedByCurrentUser ? "secondary" : "default"}
          >
            {isBookedByCurrentUser ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Booked
              </>
            ) : bookingDeadlinePassed ? (
              <>
                  <Clock className="mr-2 h-4 w-4"/>
                  Booking Closed
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
