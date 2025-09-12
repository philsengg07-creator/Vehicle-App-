export type UserRole = 'admin' | 'employee';

export interface Taxi {
  id: string;
  name: string;
  capacity: number;
  bookedSeats: number;
  bookings: Booking[];
  imageUrl: string;
  imageHint: string;
}

export interface Booking {
  id: string;
  taxiId: string;
  taxiName: string;
  employeeId: string;
  bookingTime: Date;
}

export interface AppNotification {
  id: number;
  message: string;
  date: Date;
  read: boolean;
}
