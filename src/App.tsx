/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Menu, X } from 'lucide-react';
import RoomManager from './components/RoomManager';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import UserManagement from './components/UserManagement';
import { doc, getDoc, getDocFromServer, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import BookingCalendar from './components/BookingCalendar';
import GuestProfiles from './components/GuestProfiles';
import BookingHistory from './components/BookingHistory';
import AuthPage from './components/Auth';
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
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'rooms' | 'bookings' | 'guests' | 'history' | 'users'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('ADMIN');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const unsubscribeRoomsRef = useRef<(() => void) | null>(null);
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    testConnection();
    
    // Inactivity timeout
    const resetTimer = () => lastActivity.current = Date.now();
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetTimer));

    const interval = setInterval(() => {
      if (Date.now() - lastActivity.current > 30 * 60 * 1000) {
        signOut(auth);
      }
    }, 60000); // Check every minute

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      setLoading(false);
      
      if (authUser) {
        // Fetch user role
        getDoc(doc(db, 'users', authUser.uid)).then((docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role as UserRole);
          } else {
            // Default role if not found
            setUserRole('GUEST');
          }
        });

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
      events.forEach(e => window.removeEventListener(e, resetTimer));
      clearInterval(interval);
    };
  }, []);

  const canAccess = (view: string) => {
    const isDevAdmin = user?.email === 'agbonghaeidemudia@gmail.com' || user?.email === 'admin@gmail.com';
    if (userRole === 'ADMIN' || isDevAdmin) return true;
    if (view === 'users') return false; // Admin only
    if (userRole === 'STAFF') return true;
    return view === 'dashboard';
  };

  const availableRoomsCount = rooms.filter(r => r.status === 'AVAILABLE').length;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b px-4 md:px-8 py-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">Hotel Management System</h1>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden">
            {isMenuOpen ? <X/> : <Menu/>}
          </button>
        </div>
        
        <div className={`md:flex items-center gap-6 mt-4 md:mt-0 ${isMenuOpen ? 'flex flex-col' : 'hidden md:flex'}`}>
          { (userRole === 'ADMIN' || user?.email === 'agbonghaeidemudia@gmail.com' || user?.email === 'admin@gmail.com') && (
            <select value={userRole} onChange={(e) => setUserRole(e.target.value as UserRole)} className="border p-1 rounded">
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
              <option value="GUEST">Guest</option>
            </select>
          )}

          {canAccess('dashboard') && (
            <button
              onClick={() => { setCurrentView('dashboard'); setIsMenuOpen(false); }}
              className={`px-3 py-1 rounded ${currentView === 'dashboard' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              Dashboard
            </button>
          )}
          {canAccess('rooms') && (
            <button
              onClick={() => { setCurrentView('rooms'); setIsMenuOpen(false); }}
              className={`px-3 py-1 rounded ${currentView === 'rooms' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              Rooms
            </button>
          )}
          {canAccess('bookings') && (
            <button
              onClick={() => { setCurrentView('bookings'); setIsMenuOpen(false); }}
              className={`px-3 py-1 rounded ${currentView === 'bookings' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              Bookings
            </button>
          )}
          {canAccess('guests') && (
            <button
              onClick={() => { setCurrentView('guests'); setIsMenuOpen(false); }}
              className={`px-3 py-1 rounded ${currentView === 'guests' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              Guests
            </button>
          )}
          {canAccess('users') && (
            <button
              onClick={() => { setCurrentView('users'); setIsMenuOpen(false); }}
              className={`px-3 py-1 rounded ${currentView === 'users' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
            >
              Users
            </button>
          )}
          {canAccess('history') && (
              <button
                  onClick={() => { setCurrentView('history'); setIsMenuOpen(false); }}
                  className={`px-3 py-1 rounded ${currentView === 'history' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:text-indigo-600'}`}
              >
                  History
              </button>
          )}
          <button
              onClick={() => { signOut(auth); setIsMenuOpen(false); }}
              className="px-3 py-1 rounded text-red-600 hover:text-red-700 hover:bg-red-50 md:ml-auto"
          >
              Sign Out
          </button>
        </div>
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
        ) : currentView === 'history' && canAccess('history') ? (
          <BookingHistory history={bookingHistory} rooms={rooms} />
        ) : currentView === 'users' && canAccess('users') ? (
          <UserManagement currentUserRole={userRole} />
        ) : (
          <div className="text-center mt-10">Access Denied</div>
        )}
      </div>
    </div>
  );
}
