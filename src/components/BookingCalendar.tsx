import React, { useState } from 'react';
import { Room, Booking, OperationType, Guest } from '../types';
import { doc, updateDoc, addDoc, collection, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebaseUtils';

export default function BookingCalendar({ rooms, bookings, setBookings, guests }: { rooms: Room[], bookings: Booking[], setBookings: React.Dispatch<React.SetStateAction<Booking[]>>, guests: Guest[] }) {
  const [newBooking, setNewBooking] = useState<{ roomId: string, guestName: string, checkIn: string, checkOut: string } | null>(null);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const startBooking = (roomId: string, day: number) => {
    setNewBooking({ roomId, guestName: '', checkIn: `2026-04-${day}`, checkOut: `2026-04-${day + 1}` });
  };

  const confirmBooking = async () => {
    if (newBooking) {
      if (new Date(newBooking.checkOut) <= new Date(newBooking.checkIn)) {
        alert("Check-out date must be after check-in date.");
        return;
      }
      
      try {
        // Add booking to Firestore
        await addDoc(collection(db, 'bookings'), newBooking);
        
        const roomRef = doc(db, 'rooms', newBooking.roomId);
        await updateDoc(roomRef, { status: 'BOOKED' });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'bookings');
      }

      setNewBooking(null);
      setIsConfirmationOpen(false);
    }
  };

  const handleCheckout = async (booking: Booking) => {
    try {
      // Add to history
      await addDoc(collection(db, 'bookingHistory'), booking);
      // Remove from active
      await deleteDoc(doc(db, 'bookings', booking.id));
      const roomRef = doc(db, 'rooms', booking.roomId);
      await updateDoc(roomRef, { status: 'AVAILABLE' });
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `bookings/${booking.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Booking Calendar</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {bookings.map(booking => {
              const room = rooms.find(r => r.id === booking.roomId);
              const guest = guests.find(g => `${g.firstName} ${g.lastName}` === booking.guestName);
              return (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{room?.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.guestName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{guest ? `${guest.email} / ${guest.phone}` : '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{room?.type || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.checkIn} - {booking.checkOut}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleCheckout(booking)} className="text-indigo-600 hover:text-indigo-900">
                      Checkout
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
       </div>
    </div>
  );
}
