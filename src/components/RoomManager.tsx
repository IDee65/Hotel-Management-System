import React, { useState, useEffect } from 'react';
import { CheckCircle2, User, Sparkles, Wrench, Trash2 } from 'lucide-react';
import { Room, RoomStatus, Booking } from '../types';
import { db } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';                

const StatusBadge = ({ status }: { status: RoomStatus }) => {
  const configs = {
    AVAILABLE: { icon: CheckCircle2, class: 'bg-green-100 text-green-800' },
    OCCUPIED: { icon: User, class: 'bg-blue-100 text-blue-800' },
    DIRTY: { icon: Sparkles, class: 'bg-amber-100 text-amber-800' },
    MAINTENANCE: { icon: Wrench, class: 'bg-red-100 text-red-800' },
    BOOKED: { icon: User, class: 'bg-purple-100 text-purple-800' },
  };
  const { icon: Icon, class: className } = configs[status];
  return (
    <span className={`px-2 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full ${className}`}>
      <Icon size={14} />
      {status}
    </span>
  );
};


export default function RoomManager({ rooms, bookings }: { rooms: Room[], bookings: Booking[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [form, setForm] = useState<Omit<Room, 'id'>>({
    number: '',
    type: '',
    priceTier: 0,
    status: 'AVAILABLE',
  });

  useEffect(() => {
    // Rooms are already passed from App.tsx via Firestore snapshot.
  }, []);

  const updateStatus = async (id: string, status: RoomStatus) => {
    try {
      await updateDoc(doc(db, 'rooms', id), { status });
    } catch (e) {
      console.error(e);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    (r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
     r.type.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (typeFilter === '' || r.type === typeFilter) &&
    (statusFilter === '' || r.status === statusFilter)
  );

  const openForAdd = () => {
    setEditingRoom(null);
    setForm({ number: '', type: '', priceTier: 0, status: 'AVAILABLE' });
    setIsModalOpen(true);
  };

  const openForEdit = (room: Room) => {
    setEditingRoom(room);
    setForm({ number: room.number, type: room.type, priceTier: room.priceTier, status: room.status });
    setIsModalOpen(true);
  };

  const saveRoom = async () => {
    if (editingRoom) {
      await updateDoc(doc(db, 'rooms', editingRoom.id), form);
    } else {
      await addDoc(collection(db, 'rooms'), form);
    }
    setIsModalOpen(false);
  };

  const deleteRoom = async (id: string, number: string) => {
    if (window.confirm(`Are you sure you want to delete room ${number}?`)) {
      try {
        await deleteDoc(doc(db, 'rooms', id));
      } catch (e) {
        console.error(e);
        alert('Failed to delete room.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Room Management</h2>
        <button onClick={openForAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">
          Add Room
        </button>
      </div>
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search rooms..."
          className="flex-grow border p-2 rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select className="border p-2 rounded-md" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {Array.from(new Set(rooms.map(r => r.type))).map(type => <option key={type} value={type}>{type}</option>)}
        </select>
        <select className="border p-2 rounded-md" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="AVAILABLE">AVAILABLE</option>
          <option value="OCCUPIED">OCCUPIED</option>
          <option value="DIRTY">DIRTY</option>
          <option value="MAINTENANCE">MAINTENANCE</option>
          <option value="BOOKED">BOOKED</option>
        </select>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room Number</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price Tier</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredRooms.map((room) => (
            <tr
              key={room.id}
              onClick={() => {
                setSelectedRoom(room);
                setIsDetailModalOpen(true);
              }}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-6 py-4 whitespace-nowrap">{room.number}</td>
              <td className="px-6 py-4 whitespace-nowrap">{room.type}</td>
              <td className="px-6 py-4 whitespace-nowrap">${new Intl.NumberFormat().format(room.priceTier)}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={room.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                  {room.status !== 'AVAILABLE' && (
                    <button onClick={() => updateStatus(room.id, 'AVAILABLE')} className="p-1 hover:bg-green-100 rounded text-green-600" title="Mark Available">
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  {room.status !== 'DIRTY' && (
                    <button onClick={() => updateStatus(room.id, 'DIRTY')} className="p-1 hover:bg-amber-100 rounded text-amber-600" title="Mark Dirty">
                      <Sparkles size={16} />
                    </button>
                  )}
                  {room.status !== 'MAINTENANCE' && (
                    <button onClick={() => updateStatus(room.id, 'MAINTENANCE')} className="p-1 hover:bg-red-100 rounded text-red-600" title="Send to Maintenance">
                      <Wrench size={16} />
                    </button>
                  )}
                  <button onClick={() => openForEdit(room)} className="p-1 hover:bg-indigo-100 rounded text-indigo-600" title="Edit Room">
                    <span className="text-xs font-medium">Edit</span>
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteRoom(room.id, room.number); }} className="p-1 hover:bg-red-100 rounded text-red-600" title="Delete Room">
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isDetailModalOpen && selectedRoom && (
        <div
          className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Room {selectedRoom.number} Details</h3>
            <div className="space-y-2 text-gray-700">
              <p>
                <span className="font-semibold">Type:</span> {selectedRoom.type}
              </p>
              <p>
                <span className="font-semibold">Price per night:</span> ${new Intl.NumberFormat().format(selectedRoom.priceTier)}
              </p>
              <p>
                <span className="font-semibold">Status:</span>{' '}
                <StatusBadge status={selectedRoom.status} />
              </p>
              <div className="mt-4">
                <h4 className="font-semibold">Current Guest</h4>                
                { (() => {
                  const today = new Date().toISOString().split('T')[0];
                  const currentBooking = bookings.find(b => b.roomId === selectedRoom.id && b.checkIn <= today && b.checkOut >= today);
                  return currentBooking ? <p className="text-sm bg-blue-50 border p-2 rounded mt-1 font-semibold">{currentBooking.guestName}</p> : <p className="text-sm text-gray-500 mt-1">None</p>;
                })()}

                <h4 className="font-semibold mt-4">Booking History</h4>
                {bookings.filter(b => b.roomId === selectedRoom.id).map(b => (
                  <div key={b.id} className="text-sm bg-gray-50 border p-2 rounded mt-1">
                    <p className="font-semibold">{b.guestName}</p>
                    <p className="text-xs text-gray-500">{b.checkIn} to {b.checkOut}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setIsDetailModalOpen(false)}
              className="mt-6 w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-500/75 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">{editingRoom ? 'Edit' : 'Add'} Room</h3>
            <div className="space-y-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="Number"
                value={form.number}
                onChange={(e) => setForm({ ...form, number: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="">Select Type</option>
                <option value="Standard">Standard</option>
                <option value="Suite">Suite</option>
                <option value="Deluxe">Deluxe</option>
              </select>
              <input
                className="w-full border p-2 rounded"
                type="text"
                placeholder="Price per night"
                value={form.priceTier === 0 ? '' : new Intl.NumberFormat().format(form.priceTier)}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/,/g, '');
                  if (/^\d*$/.test(rawVal)) {
                    setForm({ ...form, priceTier: rawVal === '' ? 0 : Number(rawVal) });
                  }
                }}
              />
              <select
                className="w-full border p-2 rounded"
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })}
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="OCCUPIED">OCCUPIED</option>
                <option value="DIRTY">DIRTY</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="BOOKED">BOOKED</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded">
                  Cancel
                </button>
                <button 
                  onClick={saveRoom} 
                  disabled={!form.number || !form.type || form.priceTier <= 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
