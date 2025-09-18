'use client';

import React, { createContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import type { UserRole, Taxi, Booking, AppNotification } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { sendNotification } from '@/ai/flows/send-notification';
import { db } from '@/lib/firebase';
import { ref, onValue, set, remove, push, get, child, update } from 'firebase/database';

export interface AppContextType {
  role: UserRole | null;
  switchRole: (role: UserRole) => void;
  setEmployee: (name: string) => void;
  logout: () => void;
  taxis: Taxi[];
  addTaxi: (taxi: Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>) => void;
  editTaxi: (taxiId: string, data: Partial<Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>>) => void;
  deleteTaxi: (taxiId: string) => void;
  bookSeat: (taxiId: string) => void;
  remainingEmployees: string[];
  notifications: AppNotification[];
  markNotificationsAsRead: () => void;
  employeeBookings: Booking[];
  currentEmployeeId: string | null;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [remainingEmployees, setRemainingEmployees] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const taxisRef = ref(db, 'taxis');
    const unsubscribeTaxis = onValue(taxisRef, (snapshot) => {
      const data = snapshot.val();
      const taxisArray: Taxi[] = data ? Object.keys(data).map(key => ({
        id: key,
        ...data[key],
        bookings: data[key].bookings ? Object.values(data[key].bookings) : [],
      })) : [];
      setTaxis(taxisArray);
    });

    const remainingEmployeesRef = ref(db, 'remainingEmployees');
    const unsubscribeEmployees = onValue(remainingEmployeesRef, (snapshot) => {
        const data = snapshot.val();
        setRemainingEmployees(data ? Object.values(data) as string[] : []);
    });

    const notificationsRef = ref(db, 'notifications');
    const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
        const data = snapshot.val();
        const notificationsArray: AppNotification[] = data ? Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
        setNotifications(notificationsArray);
    });

    return () => {
      unsubscribeTaxis();
      unsubscribeEmployees();
      unsubscribeNotifications();
    };
  }, []);
  

  const switchRole = useCallback((newRole: UserRole) => setRole(newRole), []);
  
  const setEmployee = useCallback((name: string) => {
      setCurrentEmployeeId(name);
      setRole('employee');
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setCurrentEmployeeId(null);
  }, []);

  const addNotification = (message: string, shouldPush: boolean = false) => {
    const notificationsRef = ref(db, 'notifications');
    const newNotificationRef = push(notificationsRef);
    const newNotification = {
      message,
      date: new Date().toISOString(),
      read: false,
    };
    set(newNotificationRef, newNotification);

    if (shouldPush) {
      sendNotification({ title: 'Taxi Alert', body: message });
    }
  };
  
  const addTaxi = (taxiData: Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>) => {
    const taxisRef = ref(db, 'taxis');
    const newTaxiRef = push(taxisRef);
    const newTaxi = {
        ...taxiData,
        bookedSeats: 0,
        bookings: {},
    };
    set(newTaxiRef, newTaxi);
    toast({ title: "Success", description: `Taxi "${taxiData.name}" added.` });
  };

  const editTaxi = (taxiId: string, data: Partial<Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>>) => {
    const taxiRef = ref(db, `taxis/${taxiId}`);
    get(taxiRef).then(snapshot => {
      if(snapshot.exists()) {
        const existingData = snapshot.val();
        set(taxiRef, { ...existingData, ...data });
        toast({ title: "Success", description: "Taxi details updated." });
      }
    });
  };

  const deleteTaxi = (taxiId: string) => {
    const taxiName = taxis.find(t => t.id === taxiId)?.name;
    const taxiRef = ref(db, `taxis/${taxiId}`);
    remove(taxiRef);
    toast({ title: "Success", description: `Taxi "${taxiName}" deleted.` });
  };

  const bookSeat = async (taxiId: string) => {
    if (!currentEmployeeId) {
        toast({ variant: "destructive", title: "Error", description: "Employee not set." });
        return;
    }
    
    const allTaxisSnapshot = await get(ref(db, 'taxis'));
    const allTaxis = allTaxisSnapshot.val() || {};
    const hasBooking = Object.values(allTaxis).some((t: any) => 
        t.bookings && Object.values(t.bookings).some((b: any) => b.employeeId === currentEmployeeId)
    );

    if (hasBooking) {
        toast({ variant: "destructive", title: "Already Booked", description: "You already have a booking." });
        return;
    }

    const taxiRef = ref(db, `taxis/${taxiId}`);
    const taxiSnapshot = await get(taxiRef);

    if (!taxiSnapshot.exists()) {
      toast({ variant: "destructive", title: "Error", description: "Taxi not found." });
      return;
    }
    
    const taxi = { id: taxiId, ...taxiSnapshot.val() };

    if (taxi.bookedSeats >= taxi.capacity) {
        const remainingEmployeesRef = ref(db, 'remainingEmployees');
        const newEmployeeRef = push(remainingEmployeesRef);
        await set(newEmployeeRef, currentEmployeeId);
        addNotification("new employee added to waiting list", true);
        toast({ title: "Taxi Full", description: "This taxi is full. You have been added to the waiting list." });
        return;
    }
    
    const bookingsRef = ref(db, `taxis/${taxiId}/bookings`);
    const newBookingRef = push(bookingsRef);
    const newBooking: Omit<Booking, 'id'> = {
        taxiId,
        taxiName: taxi.name,
        employeeId: currentEmployeeId,
        bookingTime: new Date().toISOString() as any, // RTDB will convert to string
    };
    await set(newBookingRef, newBooking);
    
    const updatedBookedSeats = taxi.bookedSeats + 1;
    await set(child(taxiRef, 'bookedSeats'), updatedBookedSeats);

    if (updatedBookedSeats === taxi.capacity) {
        addNotification(`${taxi.name} is full`, true);
    }
    
    toast({ title: "Success!", description: `Your seat in ${taxi.name} is confirmed.` });
  };

  const markNotificationsAsRead = () => {
    const updates: { [key: string]: any } = {};
    const unreadNotifications = notifications.filter(n => !n.read);
  
    if (unreadNotifications.length === 0) return;
  
    unreadNotifications.forEach(n => {
      updates[`/notifications/${n.id}/read`] = true;
    });
  
    update(ref(db), updates).then(() => {
      setNotifications(prev => 
        prev.map(n => unreadNotifications.find(un => un.id === n.id) ? { ...n, read: true } : n)
      );
    }).catch(error => {
      console.error("Error marking notifications as read:", error);
    });
  };

  const employeeBookings = useMemo(() => {
    if (!currentEmployeeId) return [];
    return taxis
        .flatMap(t => t.bookings ? Object.values(t.bookings).map(b => ({...b, taxiName: t.name, taxiId: t.id})) : [])
        .filter(b => b.employeeId === currentEmployeeId) as Booking[];
  }, [taxis, currentEmployeeId]);
  
  const value = {
    role,
    switchRole,
    setEmployee,
    logout,
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
