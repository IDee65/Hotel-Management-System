import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Guest, UserRole, Room, Booking } from '../types';
import { doc, updateDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GuestProfilesProps {
  userRole: UserRole;
  rooms: Room[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  bookings: Booking[];
}

export default function GuestProfiles({ userRole, rooms, setBookings, bookings }: GuestProfilesProps) {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [newGuest, setNewGuest] = useState({ firstName: '', middleName: '', lastName: '', email: '', phone: '', preferences: '', roomId: '', checkIn: '', checkOut: '' });
  const [editingGuest, setEditingGuest] = useState<Omit<Guest, 'preferences'> & { preferences: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const PREFERENCE_OPTIONS = ['Quiet room', 'Extra pillows', 'High floor', 'Low floor', 'Sea view', 'Near elevator', 'Late check-out', 'Early check-in'];
  
  useEffect(() => {
    const fetchGuests = async () => {
      const snapshot = await getDocs(collection(db, 'guests'));
      setGuests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Guest, 'id'>, preferences: doc.data().preferences || [] })));
    };
    fetchGuests();
  }, []);

  const bookRoom = async (guest: Guest, roomId: string) => {
    await addDoc(collection(db, 'bookings'), {
      roomId: roomId,
      guestName: `${guest.firstName} ${guest.lastName}`,
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
    
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { status: 'BOOKED' });
  };

  const updateGuest = () => {
    if (editingGuest) {
      setGuests(guests.map(g => g.id === editingGuest.id ? {
        id: editingGuest.id,
        firstName: editingGuest.firstName,
        middleName: editingGuest.middleName || null,
        lastName: editingGuest.lastName,
        email: editingGuest.email,
        phone: editingGuest.phone,
        preferences: editingGuest.preferences.split(',').map(p => p.trim()).filter(Boolean)
      } : g));
      setEditingGuest(null);
    }
  };

  const handlePreferenceChange = (option: string) => {
    const currentPrefs = editingGuest ? editingGuest.preferences : newGuest.preferences;
    const prefArray = currentPrefs.split(',').map(p => p.trim()).filter(Boolean);
    
    if (!prefArray.includes(option)) {
      const updatedPrefs = [...prefArray, option].join(', ');
      if (editingGuest) {
        setEditingGuest({ ...editingGuest, preferences: updatedPrefs });
      } else {
        setNewGuest({ ...newGuest, preferences: updatedPrefs });
      }
    }
  };

  const deleteGuest = async (id: string) => {
    await deleteDoc(doc(db, 'guests', id));
    setGuests(guests.filter(g => g.id !== id));
  };

  const addGuest = async () => {
    const guestData = {
      firstName: newGuest.firstName,
      middleName: newGuest.middleName || null,
      lastName: newGuest.lastName,
      email: newGuest.email,
      phone: newGuest.phone,
      preferences: newGuest.preferences.split(',').map(p => p.trim()).filter(Boolean)
    };
    
    const docRef = await addDoc(collection(db, 'guests'), guestData);
    setGuests([...guests, { id: docRef.id, ...guestData as any }]);
    
    if (newGuest.roomId && newGuest.checkIn && newGuest.checkOut) {
        await addDoc(collection(db, 'bookings'), {
            roomId: newGuest.roomId,
            guestName: `${guestData.firstName} ${guestData.lastName}`,
            checkIn: newGuest.checkIn,
            checkOut: newGuest.checkOut
        });
        await updateDoc(doc(db, 'rooms', newGuest.roomId), { status: 'BOOKED' });
    }

    setNewGuest({ firstName: '', middleName: '', lastName: '', email: '', phone: '', preferences: '', roomId: '', checkIn: '', checkOut: '' });
  };

  const filteredGuests = guests.filter(g => 
    `${g.firstName} ${g.middleName ? g.middleName + ' ' : ''}${g.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) || 
    g.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Guest Profiles</h2>
      
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-bold mb-2">{editingGuest ? 'Edit Guest' : 'Add New Guest'}</h3>
        <form onSubmit={editingGuest ? e => { e.preventDefault(); updateGuest(); } : e => { e.preventDefault(); addGuest(); }}>
          <input required className="w-full border p-2 mb-2" placeholder="First Name" value={editingGuest ? editingGuest.firstName : newGuest.firstName} onChange={e => editingGuest ? setEditingGuest({...editingGuest, firstName: e.target.value}) : setNewGuest({...newGuest, firstName: e.target.value})} />
          <input className="w-full border p-2 mb-2" placeholder="Middle Name (Optional)" value={editingGuest ? (editingGuest.middleName || '') : newGuest.middleName} onChange={e => editingGuest ? setEditingGuest({...editingGuest, middleName: e.target.value}) : setNewGuest({...newGuest, middleName: e.target.value})} />
          <input required className="w-full border p-2 mb-2" placeholder="Last Name" value={editingGuest ? editingGuest.lastName : newGuest.lastName} onChange={e => editingGuest ? setEditingGuest({...editingGuest, lastName: e.target.value}) : setNewGuest({...newGuest, lastName: e.target.value})} />
          <input required type="email" className="w-full border p-2 mb-2" placeholder="Email" value={editingGuest ? editingGuest.email : newGuest.email} onChange={e => editingGuest ? setEditingGuest({...editingGuest, email: e.target.value}) : setNewGuest({...newGuest, email: e.target.value})} />
          <input required type="tel" className="w-full border p-2 mb-2" placeholder="Phone (11 digits)" value={editingGuest ? editingGuest.phone : newGuest.phone} onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 11); editingGuest ? setEditingGuest({...editingGuest, phone: val}) : setNewGuest({...newGuest, phone: val})}} />
          <select className="w-full border p-2 mb-2" onChange={(e) => handlePreferenceChange(e.target.value)} value="">
            <option value="" disabled>Add Preference</option>
            {PREFERENCE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          <input required className="w-full border p-2 mb-2" placeholder="Preferences (comma separated)" value={editingGuest ? editingGuest.preferences : newGuest.preferences} onChange={e => editingGuest ? setEditingGuest({...editingGuest, preferences: e.target.value}) : setNewGuest({...newGuest, preferences: e.target.value})} />
          {!editingGuest && (
            <>
                <select required className="w-full border p-2 mb-2" value={newGuest.roomId} onChange={e => setNewGuest({...newGuest, roomId: e.target.value})}>
                    <option value="">Select Room (Mandatory)</option>
                    {rooms.map(room => <option key={room.id} value={room.id} disabled={room.status !== 'AVAILABLE'}>Room {room.number}</option>)}
                </select>
                <label className="block text-sm font-medium text-gray-700">Check In Date *</label>
                <input required type="date" className="w-full border p-2 mb-2" value={newGuest.checkIn} onChange={e => setNewGuest({...newGuest, checkIn: e.target.value})} />
                <label className="block text-sm font-medium text-gray-700">Check Out Date *</label>
                <input required type="date" className="w-full border p-2 mb-2" value={newGuest.checkOut} onChange={e => setNewGuest({...newGuest, checkOut: e.target.value})} />
            </>
          )}
          <button 
            type="submit" 
            className={`p-2 rounded text-white ${
              (editingGuest ? (editingGuest.firstName && editingGuest.lastName && editingGuest.email && editingGuest.phone) : (newGuest.firstName && newGuest.lastName && newGuest.email && newGuest.phone && newGuest.roomId && newGuest.checkIn && newGuest.checkOut))
                ? 'bg-indigo-600' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
            disabled={editingGuest ? !(editingGuest.firstName && editingGuest.lastName && editingGuest.email && editingGuest.phone) : !(newGuest.firstName && newGuest.lastName && newGuest.email && newGuest.phone && newGuest.roomId && newGuest.checkIn && newGuest.checkOut)}
          >
            {editingGuest ? 'Update' : 'Add'}
          </button>
        </form>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={20} />
        <input
          type="text"
          placeholder="Search guests by name or email..."
          className="w-full border p-2 pl-10 rounded-md"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid gap-4">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="bg-white p-4 rounded shadow flex justify-between items-center">
            <div>
              <p className="font-bold">{guest.firstName} {guest.middleName ? guest.middleName + ' ' : ''}{guest.lastName}</p>
              <p className="text-sm text-gray-500">{guest.email} | {guest.phone}</p>
              {(() => {
                const guestBookings = bookings.filter(b => b.guestName === `${guest.firstName} ${guest.lastName}`);
                if (guestBookings.length === 0) return null;
                
                return (
                    <div className="mt-2">
                        <p className="font-semibold text-sm">Past Bookings:</p>
                        {guestBookings.map(gb => {
                            const days = Math.max(1, (new Date(gb.checkOut).getTime() - new Date(gb.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                            return (
                                <p key={gb.id} className="text-sm text-gray-600">
                                    Room: {rooms.find(r => r.id === gb.roomId)?.number || 'N/A'}, {days} days ({gb.checkIn} - {gb.checkOut})
                                </p>
                            );
                        })}
                    </div>
                );
              })()}
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-xs text-gray-500 mr-1">Preferences:</span>
                {guest.preferences.map((pref, i) => (
                  <span key={i} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded-full">{pref}</span>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <BookingButton guest={guest} rooms={rooms} bookRoom={bookRoom} bookings={bookings} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="text-indigo-600" onClick={() => setEditingGuest({...guest, middleName: guest.middleName || '', preferences: guest.preferences.join(', ')})}>Edit</button>
              {userRole === 'ADMIN' && (
                <button className="text-red-600" onClick={() => deleteGuest(guest.id)}>Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingButton({ guest, rooms, bookRoom, bookings }: { guest: Guest, rooms: Room[], bookRoom: (guest: Guest, roomId: string) => void, bookings: Booking[] }) {
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const isBooked = bookings.some(b => b.guestName === `${guest.firstName} ${guest.lastName}`);
    if (isBooked) return <button className="bg-gray-400 text-white text-xs px-2 rounded" disabled>Booked</button>;
    return (
        <>
            <select className="border p-1 text-sm rounded" onChange={(e) => setSelectedRoomId(e.target.value)}>
                <option value="">Room</option>
                {rooms.map(room => (
                    <option key={room.id} value={room.id} disabled={room.status !== 'AVAILABLE'}>
                    {room.number}
                    </option>
                ))}
            </select>
            <button className="bg-green-600 text-white text-xs px-2 rounded" onClick={() => selectedRoomId && bookRoom(guest, selectedRoomId)}>Book</button>
        </>
    );
}
