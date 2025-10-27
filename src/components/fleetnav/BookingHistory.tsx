
"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { ref, onValue } from "firebase/database";
import type { Booking } from "@/types";
import { Loader2 } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { format } from 'date-fns';

type GroupedBookings = {
  [date: string]: Booking[];
};

export function BookingHistory() {
  const [groupedBookings, setGroupedBookings] = useState<GroupedBookings>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const historyRef = ref(db, "bookingHistory");
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const historyData = snapshot.val();
      if (historyData) {
        const bookingsByDate: GroupedBookings = {};

        // The data is grouped by date string (YYYY-MM-DD)
        Object.keys(historyData).forEach((dateKey) => {
          const dayBookings = historyData[dateKey];
          const bookingsArray: Booking[] = Object.keys(dayBookings).map(bookingId => ({
            id: bookingId,
            ...dayBookings[bookingId],
          }));

          // Sort bookings within the day by time
          bookingsArray.sort((a, b) => new Date(b.bookingTime).getTime() - new Date(a.bookingTime).getTime());

          bookingsByDate[dateKey] = bookingsArray;
        });

        setGroupedBookings(bookingsByDate);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const sortedDates = Object.keys(groupedBookings).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (sortedDates.length === 0) {
    return <p className="text-center text-muted-foreground py-16">No booking history found.</p>;
  }

  const formatBookingDisplayTime = (isoString: string) => {
    return format(new Date(isoString), "h:mm a");
  };
  
  const formatAccordionHeaderDate = (dateString: string) => {
    return format(new Date(dateString), "eeee, MMMM do, yyyy");
  }


  return (
    <div className="space-y-4">
       <Accordion type="single" collapsible defaultValue={sortedDates[0]}>
        {sortedDates.map((date) => (
            <AccordionItem value={date} key={date}>
                <AccordionTrigger className="text-lg font-semibold">
                    {formatAccordionHeaderDate(date)}
                </AccordionTrigger>
                <AccordionContent>
                    <ul className="space-y-3 pl-2 border-l-2 ml-2">
                        {groupedBookings[date].map((booking) => (
                        <li key={booking.id} className="flex flex-col p-3 bg-secondary/50 rounded-md">
                            <div className="flex justify-between items-center font-medium">
                                <span>{booking.employeeId}</span>
                                <span className="text-sm text-foreground">{booking.taxiName}</span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">
                                Booked at {formatBookingDisplayTime(booking.bookingTime)}
                            </span>
                        </li>
                        ))}
                    </ul>
                </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
