export type UserRole = 'admin' | 'employee';

export interface Taxi {
  id: string;
  name: string;
  capacity: number;
  bookedSeats: number;
  bookings: Booking[];
  bookingDeadline?: string; // e.g., "17:00"
}

export interface Booking {
  id: string;
  taxiId: string;
  taxiName: string;
  employeeId: string;
  bookingTime: string; // Changed to string to match Firebase RTDB
}

export interface AppNotification {
  id: any;
  message: string;
  date: string; // Changed to string to match Firebase RTDB
  read: boolean;
}
