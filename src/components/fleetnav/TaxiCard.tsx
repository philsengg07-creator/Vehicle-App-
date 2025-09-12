"use client";

import Image from "next/image";
import { Users, Edit, Trash2, CheckCircle, Car } from "lucide-react";
import { useApp } from "@/hooks/use-app";
import type { Taxi } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

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

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg animate-in fade-in-0 zoom-in-95">
       <div className="relative">
        <Image src={taxi.imageUrl} alt={taxi.name} width={600} height={400} className="w-full h-48 object-cover" data-ai-hint={taxi.imageHint} />
        {isFull && <Badge variant="destructive" className="absolute top-2 right-2 shadow-lg">Full</Badge>}
      </div>
      <CardHeader>
        <CardTitle className="font-headline text-xl">{taxi.name}</CardTitle>
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
