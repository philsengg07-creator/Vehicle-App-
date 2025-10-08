
'use client';

import React, { createContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import type { UserRole, Taxi, Booking, AppNotification } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { ref, onValue, set, remove, push, get, update } from 'firebase/database';
import { sendNotification as sendPushNotification } from '@/app/actions/sendNotification';

async function resetData() {
  try {
    const updates: { [key: string]: any } = {};
    
    // Fetch all taxis to update them
    const taxisSnapshot = await get(ref(db, 'taxis'));
    if (taxisSnapshot.exists()) {
      const taxis = taxisSnapshot.val();
      for (const taxiId in taxis) {
        updates[`/taxis/${taxiId}/bookedSeats`] = 0;
        updates[`/taxis/${taxiId}/bookings`] = null;
        updates[`/taxis/${taxiId}/status`] = 'open';
      }
    }

    updates['/remainingEmployees'] = null;
    updates['/notifications'] = null;
    updates['/lastResetTimestamp'] = new Date().toISOString();

    await update(ref(db), updates);
    
    console.log('Daily data reset successfully via client-side.');
  } catch (error) {
    console.error('Error resetting data from client:', error);
    throw error;
  }
}


export interface AppContextType {
  role: UserRole | null;
  switchRole: (role: UserRole) => void;
  setEmployee: (name: string) => void;
  logout: () => void;
  taxis: Taxi[];
  addTaxi: (taxi: Omit<Taxi, 'id' | 'bookedSeats' | 'bookings' | 'status'>) => void;
  editTaxi: (taxiId: string, data: Partial<Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>>) => void;
  deleteTaxi: (taxiId: string) => void;
  bookSeat: (taxiId: string) => void;
  remainingEmployees: string[];
  notifications: AppNotification[];
  markNotificationsAsRead: () => void;
  employeeBookings: Booking[];
  currentEmployeeId: string | null;
  isLoading: boolean;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<UserRole | null>(null);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [taxis, setTaxis] = useState<Taxi[]>([]);
  const [remainingEmployees, setRemainingEmployees] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializeApp = async () => {
      
      const attachListeners = () => {
        const taxisRef = ref(db, 'taxis');
        const taxisUnsubscribe = onValue(taxisRef, (snapshot) => {
          const data = snapshot.val();
          const taxisArray: Taxi[] = data ? Object.keys(data).map(key => {
            const taxiData = data[key];
            return {
              id: key,
              ...taxiData,
              bookings: taxiData.bookings ? Object.keys(taxiData.bookings).map(bookingKey => ({
                id: bookingKey,
                ...taxiData.bookings[bookingKey]
              })) : [],
            };
          }) : [];
          setTaxis(taxisArray);
        });
    
        const remainingEmployeesRef = ref(db, 'remainingEmployees');
        const employeesUnsubscribe = onValue(remainingEmployeesRef, (snapshot) => {
            const data = snapshot.val();
            setRemainingEmployees(data ? Object.values(data) as string[] : []);
        });
    
        const notificationsRef = ref(db, 'notifications');
        const notificationsUnsubscribe = onValue(notificationsRef, (snapshot) => {
            const data = snapshot.val();
            const notificationsArray: AppNotification[] = data ? Object.keys(data).map(key => ({
                id: key,
                ...data[key]
            })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];
            setNotifications(notificationsArray);
        });

        setIsLoading(false);
  
        return () => {
          taxisUnsubscribe();
          employeesUnsubscribe();
          notificationsUnsubscribe();
        };
      };

      try {
        setIsLoading(true);
        const lastResetRef = ref(db, 'lastResetTimestamp');
        const snapshot = await get(lastResetRef);
        const lastResetTimestamp = snapshot.val();
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;

        if (!lastResetTimestamp || (now - new Date(lastResetTimestamp).getTime() > oneDay)) {
          console.log("Resetting application data...");
          await resetData();
        } else {
          console.log("Skipping automatic data reset.");
        }
      } catch (error) {
        console.error("Failed during app initialization check:", error);
      } finally {
        attachListeners();
      }
    };

    initializeApp();

  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const updates: { [key: string]: any } = {};

      taxis.forEach(taxi => {
        if (taxi.status === 'open' && taxi.bookingDeadline) {
          const [hours, minutes] = taxi.bookingDeadline.split(':').map(Number);
          const deadlineDate = new Date();
          deadlineDate.setHours(hours, minutes, 0, 0);

          if (now > deadlineDate) {
            updates[`/taxis/${taxi.id}/status`] = 'closed';
          }
        }
      });

      if (Object.keys(updates).length > 0) {
        update(ref(db), updates);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [taxis]);
  

  const switchRole = useCallback((newRole: UserRole) => setRole(newRole), []);
  
  const setEmployee = useCallback((name: string) => {
      setCurrentEmployeeId(name);
      setRole('employee');
  }, []);

  const logout = useCallback(() => {
    setRole(null);
    setCurrentEmployeeId(null);
  }, []);

  const addTaxi = (taxiData: Omit<Taxi, 'id' | 'bookedSeats' | 'bookings' | 'status'>) => {
    const taxisRef = ref(db, 'taxis');
    const newTaxiRef = push(taxisRef);
    const newTaxi = {
        ...taxiData,
        bookedSeats: 0,
        bookings: {},
        status: 'open' as const,
    };
    set(newTaxiRef, newTaxi);
    toast({ title: "Success", description: `Taxi "${taxiData.name}" added.` });
  };

  const editTaxi = (taxiId: string, data: Partial<Omit<Taxi, 'id' | 'bookedSeats' | 'bookings'>>) => {
    const taxiRef = ref(db, `taxis/${taxiId}`);
    get(taxiRef).then(snapshot => {
      if(snapshot.exists()) {
        const existingData = snapshot.val();
        update(taxiRef, { ...existingData, ...data });
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
    
    if (taxi.status === 'closed') {
        toast({
            variant: "destructive",
            title: "Booking Closed",
            description: `The booking deadline for ${taxi.name} has passed.`,
        });
        return;
    }

    if (taxi.bookingDeadline) {
        const now = new Date();
        const [hours, minutes] = taxi.bookingDeadline.split(':').map(Number);
        const deadlineDate = new Date();
        deadlineDate.setHours(hours, minutes, 0, 0);

        if (now > deadlineDate) {
            update(taxiRef, { status: 'closed' });
            toast({
                variant: "destructive",
                title: "Booking Closed",
                description: `The booking deadline for ${taxi.name} has passed.`,
            });
            return;
        }
    }
    
    const addNotification = async (message: string, shouldPush: boolean = false) => {
        const notificationsRef = ref(db, 'notifications');
        const newNotificationRef = push(notificationsRef);
        const newNotification = {
          message,
          date: new Date().toISOString(),
          read: false,
        };
        await set(newNotificationRef, newNotification);
    
        if (shouldPush) {
          try {
            await sendPushNotification('Taxi Management Alert', message);
          } catch (error) {
            console.error("Failed to send push notification:", error);
          }
        }
    };

    if (taxi.bookedSeats >= taxi.capacity) {
        const remainingEmployeesRef = ref(db, 'remainingEmployees');
        const newEmployeeRef = push(remainingEmployeesRef);
        await set(newEmployeeRef, currentEmployeeId);
        await addNotification(`An employee (${currentEmployeeId}) was added to the waiting list.`, true);
        toast({ title: "Taxi Full", description: "This taxi is full. You have been added to the waiting list." });
        return;
    }
    
    const bookingsRef = ref(db, `taxis/${taxiId}/bookings`);
    const newBookingRef = push(bookingsRef);
    const newBooking: Omit<Booking, 'id'> = {
        taxiId,
        taxiName: taxi.name,
        employeeId: currentEmployeeId,
        bookingTime: new Date().toISOString()
    };
    await set(newBookingRef, newBooking);
    
    const updatedBookedSeats = (taxi.bookedSeats || 0) + 1;
    await update(taxiRef, { bookedSeats: updatedBookedSeats });

    await addNotification(`${currentEmployeeId} has booked a seat in "${taxi.name}".`);

    if (updatedBookedSeats === taxi.capacity) {
        await addNotification(`The taxi "${taxi.name}" is now full.`, true);
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
        .flatMap(t => t.bookings ? t.bookings.map(b => ({...b, taxiName: t.name, taxiId: t.id})) : [])
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
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
