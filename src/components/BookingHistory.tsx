import React from 'react';
import { Booking, Room } from '../types';

export default function BookingHistory({ history, rooms }: { history: Booking[], rooms: Room[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Booking History</h2>
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {history.map(booking => {
              const room = rooms.find(r => r.id === booking.roomId);
              return (
                <tr key={booking.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{room?.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{booking.guestName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{booking.checkIn} - {booking.checkOut}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
       </div>
    </div>
  );
}
