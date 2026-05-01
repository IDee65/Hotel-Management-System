import { Booking, Room, UserRole } from '../types';

export default function Dashboard({ rooms, availableRoomsCount, userRole, bookings }: { rooms: Room[], availableRoomsCount: number, userRole: UserRole, bookings: Booking[] }) {
  const today = new Date().toISOString().split('T')[0];
  const checkInsToday = bookings.filter(b => b.checkIn === today).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-500">Available Rooms</h3>
        <p className="text-3xl font-bold mt-2">{availableRoomsCount}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-500">Occupied Rooms</h3>
        <p className="text-3xl font-bold mt-2">{rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'BOOKED').length}</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-500">Occupancy</h3>
        <p className="text-3xl font-bold mt-2">{rooms.length > 0 ? Math.round(((rooms.filter(r => r.status === 'OCCUPIED' || r.status === 'BOOKED').length) / rooms.length) * 100) : 0}%</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-medium text-gray-500">Check-ins Today</h3>
        <p className="text-3xl font-bold mt-2">{checkInsToday}</p>
      </div>
      {userRole === 'ADMIN' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-500">Revenue (MTD)</h3>
          <p className="text-3xl font-bold mt-2">$24,500</p>
        </div>
      )}
    </div>
  );
}
