/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import RoomManager from './components/RoomManager';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import { doc, getDocFromServer, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import BookingCalendar from './components/BookingCalendar';
import GuestProfiles from './components/GuestProfiles';
import BookingHistory from './components/BookingHistory';
import { Room, UserRole, Booking, Guest } from './types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  // Not throwing here because this is used in onSnapshot error handler which should just log for now to survive
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

export default function App() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [bookingHistory, setBookingHistory] = useState<Booking[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'rooms' | 'bookings' | 'guests' | 'history'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const unsubscribeRoomsRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    testConnection();
    
    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      
      if (authUser) {
        // User is authenticated, now subscribe to data
        const unsubRooms = onSnapshot(collection(db, 'rooms'), (snapshot) => {
          setRooms(snapshot.docs.map(doc => ({ ...doc.data() as Room, id: doc.id })));
        }, (error) => {
            console.error("Error with rooms snapshot:", error);
            handleFirestoreError(error, OperationType.GET, 'rooms');
        });

        const unsubGuests = onSnapshot(collection(db, 'guests'), (snapshot) => {
            setGuests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<Guest, 'id'>, preferences: doc.data().preferences || [] })));
        }, (error) => {
            console.error("Error with guests snapshot:", error);
            handleFirestoreError(error, OperationType.GET, 'guests');
        });                

        const unsubBookings = onSnapshot(collection(db, 'bookings'), (snapshot) => {
            setBookings(snapshot.docs.map(doc => ({ ...doc.data() as Booking, id: doc.id })));
        }, (error) => {
            console.error("Error with bookings snapshot:", error);
            handleFirestoreError(error, OperationType.GET, 'bookings');
        });
        
        const unsubBookingHistory = onSnapshot(collection(db, 'bookingHistory'), (snapshot) => {
            setBookingHistory(snapshot.docs.map(doc => ({ ...doc.data() as Booking, id: doc.id })));
        }, (error) => {
            console.error("Error with bookingHistory snapshot:", error);
            handleFirestoreError(error, OperationType.GET, 'bookingHistory');
        });

        unsubscribeRoomsRef.current = () => {
            unsubRooms();
            unsubGuests();
            unsubBookings();
            unsubBookingHistory();
        };
      } else {
        if (unsubscribeRoomsRef.current) {
          unsubscribeRoomsRef.current();
          unsubscribeRoomsRef.current = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeRoomsRef.current) unsubscribeRoomsRef.current();
    };
  }, []);

  const canAccess = (view: string) => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'STAFF') return true;
    return view === 'dashboard';
  };

  const availableRoomsCount = rooms.filter(r => r.status === 'AVAILABLE').length;

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <button
          onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
          className="px-6 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 flex items-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-8 py-4 flex gap-6 items-center">
        <h1 className="text-xl font-bold text-gray-900">Hotel Management System</h1>
        
        <select value={userRole} onChange={(e) => setUserRole(e.target.value as UserRole)} className="border p-1 rounded">
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="GUEST">Guest</option>
        </select>

        {canAccess('dashboard') && (
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-3 py-1 rounded ${currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
          >
            Dashboard
          </button>
        )}
        {canAccess('rooms') && (
          <button
            onClick={() => setCurrentView('rooms')}
            className={`px-3 py-1 rounded ${currentView === 'rooms' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
          >
            Rooms
          </button>
        )}
        {canAccess('bookings') && (
          <button
            onClick={() => setCurrentView('bookings')}
            className={`px-3 py-1 rounded ${currentView === 'bookings' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
          >
            Bookings
          </button>
        )}
        {canAccess('guests') && (
          <button
            onClick={() => setCurrentView('guests')}
            className={`px-3 py-1 rounded ${currentView === 'guests' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
          >
            Guests
          </button>
        )}
        <button
            onClick={() => setCurrentView('history')}
            className={`px-3 py-1 rounded ${currentView === 'history' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
        >
            History
        </button>
      </nav>
      <div className="p-8">
        {currentView === 'dashboard' ? (
          <Dashboard rooms={rooms} availableRoomsCount={availableRoomsCount} userRole={userRole} bookings={bookings} />
        ) : currentView === 'rooms' && canAccess('rooms') ? (
          <RoomManager rooms={rooms} bookings={bookings} />
        ) : currentView === 'bookings' && canAccess('bookings') ? (
          <BookingCalendar rooms={rooms} bookings={bookings} setBookings={setBookings} guests={guests} />
        ) : currentView === 'guests' && canAccess('guests') ? (
          <GuestProfiles userRole={userRole} rooms={rooms} setBookings={setBookings} bookings={bookings} />
        ) : currentView === 'history' ? (
          <BookingHistory history={bookingHistory} rooms={rooms} />
        ) : (
          <div className="text-center mt-10">Access Denied</div>
        )}
      </div>
    </div>
  );
}
