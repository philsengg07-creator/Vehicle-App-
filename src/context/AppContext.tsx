'use client';

import React, { createContext, useState, ReactNode, useMemo } from 'react';
import type { UserRole, Taxi, Booking, AppNotification } from '@/types';
import { INITIAL_TAXIS, INITIAL_REMAINING_EMPLOYEES, INITIAL_NOTIFICATIONS } from '@/lib/data';
import { useToast } from "@/hooks/use-toast";

export interface AppContextType {
  role: UserRole;
  switchRole: (role: UserRole) => void;
  taxis: Taxi[];
  addTaxi: (taxi: Omit<Taxi, 'id' | 'bookedSeats' | 'bookings' | 'imageUrl' | 'imageHint'>) => void;
  editTaxi: (taxiId: string, data: Partial<Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>>) => void;
  deleteTaxi: (taxiId: string) => void;
  bookSeat: (taxiId: string) => void;
  remainingEmployees: string[];
  notifications: AppNotification[];
  markNotificationsAsRead: () => void;
  employeeBookings: Booking[];
  currentEmployeeId: string;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole>('employee');
  const [taxis, setTaxis] = useState<Taxi[]>(INITIAL_TAXIS);
  const [remainingEmployees, setRemainingEmployees] = useState<string[]>(INITIAL_REMAINING_EMPLOYEES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const { toast } = useToast();
  
  const currentEmployeeId = 'emp-1';

  const switchRole = (newRole: UserRole) => setRole(newRole);

  const addNotification = (message: string) => {
    const newNotification: AppNotification = {
      id: Date.now(),
      message,
      date: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const addTaxi = (taxiData: Omit<Taxi, 'id' | 'bookedSeats' | 'bookings' | 'imageUrl' | 'imageHint'>) => {
    const newTaxi: Taxi = {
        ...taxiData,
        id: `taxi-${Date.now()}`,
        bookedSeats: 0,
        bookings: [],
        imageUrl: `https://picsum.photos/seed/${Date.now()}/600/400`,
        imageHint: "taxi car",
    };
    setTaxis(prev => [newTaxi, ...prev]);
    toast({ title: "Success", description: `Taxi "${newTaxi.name}" added.` });
  };

  const editTaxi = (taxiId: string, data: Partial<Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>>) => {
    setTaxis(prev => prev.map(t => t.id === taxiId ? { ...t, ...data } : t));
    toast({ title: "Success", description: "Taxi details updated." });
  };

  const deleteTaxi = (taxiId: string) => {
    const taxiName = taxis.find(t => t.id === taxiId)?.name;
    setTaxis(prev => prev.filter(t => t.id !== taxiId));
    toast({ title: "Success", description: `Taxi "${taxiName}" deleted.` });
  };

  const bookSeat = (taxiId: string) => {
    const taxi = taxis.find(t => t.id === taxiId);
    if (!taxi) {
      toast({ variant: "destructive", title: "Error", description: "Taxi not found." });
      return;
    }

    if (taxi.bookings.some(b => b.employeeId === currentEmployeeId)) {
        toast({ variant: "destructive", title: "Already Booked", description: "You have already booked a seat in this taxi." });
        return;
    }
    
    if (taxi.bookedSeats >= taxi.capacity) {
        setRemainingEmployees(prev => [...prev, currentEmployeeId]);
        addNotification(`Employee ${currentEmployeeId} was added to the remaining list for taxi "${taxi.name}".`);
        toast({ title: "Taxi Full", description: "This taxi is full. You have been added to the waiting list." });
        return;
    }
    
    const newBooking: Booking = {
        id: `booking-${Date.now()}`,
        taxiId,
        taxiName: taxi.name,
        employeeId: currentEmployeeId,
        bookingTime: new Date(),
    };
    
    setTaxis(prev => prev.map(t => {
        if (t.id === taxiId) {
            const updatedTaxi = {
                ...t,
                bookedSeats: t.bookedSeats + 1,
                bookings: [...t.bookings, newBooking],
            };

            if (updatedTaxi.bookedSeats === updatedTaxi.capacity) {
                addNotification(`Taxi "${updatedTaxi.name}" is now full.`);
            }

            return updatedTaxi;
        }
        return t;
    }));
    
    toast({ title: "Success!", description: `Your seat in ${taxi.name} is confirmed.` });
  };

  const markNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  };

  const employeeBookings = useMemo(() => {
    return taxis.flatMap(t => t.bookings).filter(b => b.employeeId === currentEmployeeId);
  }, [taxis, currentEmployeeId]);
  
  const value = {
    role,
    switchRole,
    taxis,
    addTaxi,
    editTaxi,
    deleteTaxi,
    bookSeat,
    remainingEmployees,
    notifications,
    markNotificationsAsRead,
    employeeBookings,
    currentEmployeeId,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
