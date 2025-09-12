"use client";

import { useApp } from "@/hooks/use-app";
import { TaxiCard } from "./TaxiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListCollapse } from "lucide-react";
import { format } from "date-fns";

export function EmployeeDashboard() {
  const { taxis, employeeBookings } = useApp();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-8">
      <div className="lg:col-span-2">
        <h2 className="text-2xl font-bold font-headline mb-6">Available Taxis</h2>
        
        {taxis.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {taxis.map((taxi) => (
              <TaxiCard key={taxi.id} taxi={taxi} onEdit={() => {}} />
            ))}
          </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <h3 className="text-lg font-semibold">No Taxis Available</h3>
                <p className="text-muted-foreground mt-1">Please check back later.</p>
            </div>
        )}
      </div>
      <div className="lg:col-span-1">
        <Card className="sticky top-20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ListCollapse />
                    My Bookings
                </CardTitle>
            </CardHeader>
            <CardContent>
                {employeeBookings.length > 0 ? (
                <ul className="space-y-3">
                    {employeeBookings.map((booking) => (
                    <li key={booking.id} className="p-3 bg-secondary rounded-md transition-colors hover:bg-secondary/80">
                        <p className="font-semibold">{booking.taxiName}</p>
                        <p className="text-sm text-muted-foreground">
                            {format(booking.bookingTime, "MMM d, yyyy 'at' h:mm a")}
                        </p>
                    </li>
                    ))}
                </ul>
                ) : (
                <p className="text-sm text-muted-foreground text-center py-4">You haven't booked any taxis yet.</p>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
