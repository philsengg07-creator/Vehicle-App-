import type { Taxi, Booking, AppNotification } from '@/types';

const placeholderImages = [
  {
    imageUrl: "https://picsum.photos/seed/taxi1/600/400",
    imageHint: "yellow taxi"
  },
  {
    imageUrl: "https://picsum.photos/seed/taxi2/600/400",
    imageHint: "white car"
  },
  {
    imageUrl: "https://picsum.photos/seed/taxi3/600/400",
    imageHint: "taxi night"
  }
];

export const INITIAL_TAXIS: Taxi[] = [
  {
    id: 'taxi-1',
    name: 'City Cruiser',
    capacity: 4,
    bookedSeats: 2,
    bookings: [
      { id: 'booking-1', taxiId: 'taxi-1', taxiName: 'City Cruiser', employeeId: 'emp-2', bookingTime: new Date(new Date().setDate(new Date().getDate()-1)) },
      { id: 'booking-2', taxiId: 'taxi-1', taxiName: 'City Cruiser', employeeId: 'emp-3', bookingTime: new Date(new Date().setDate(new Date().getDate()-1)) }
    ],
    imageUrl: placeholderImages[0].imageUrl,
    imageHint: placeholderImages[0].imageHint
  },
  {
    id: 'taxi-2',
    name: 'Metro Shuttle',
    capacity: 6,
    bookedSeats: 6,
    bookings: Array.from({ length: 6 }, (_, i) => ({
      id: `booking-${3 + i}`,
      taxiId: 'taxi-2',
      taxiName: 'Metro Shuttle',
      employeeId: `emp-${4 + i}`,
      bookingTime: new Date(),
    })),
    imageUrl: placeholderImages[1].imageUrl,
    imageHint: placeholderImages[1].imageHint
  },
  {
    id: 'taxi-3',
    name: 'Express Line',
    capacity: 4,
    bookedSeats: 0,
    bookings: [],
    imageUrl: placeholderImages[2].imageUrl,
    imageHint: placeholderImages[2].imageHint
  }
];

export const INITIAL_REMAINING_EMPLOYEES: string[] = ['emp-10', 'emp-11'];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
    { id: 1, message: 'Taxi "Metro Shuttle" is now full.', date: new Date(Date.now() - 1000 * 60 * 5), read: true },
    { id: 2, message: 'Employee emp-10 was added to the remaining list.', date: new Date(Date.now() - 1000 * 60 * 3), read: true },
    { id: 3, message: 'Employee emp-11 was added to the remaining list.', date: new Date(Date.now() - 1000 * 60 * 1), read: false },
];
