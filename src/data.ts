import { Room, Booking } from './types';

export const initialRooms: Room[] = [
  { id: '1', number: '101', type: 'Standard', priceTier: 100, status: 'AVAILABLE' },
  { id: '2', number: '102', type: 'Suite', priceTier: 250, status: 'DIRTY' },
];

export const initialBookings: Booking[] = [
  { id: '1', roomId: '1', guestName: 'Alice Smith', checkIn: '2026-04-01', checkOut: '2026-04-05' },
  { id: '2', roomId: '2', guestName: 'Bob Jones', checkIn: '2026-04-10', checkOut: '2026-04-12' },
];
