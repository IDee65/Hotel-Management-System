import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserRole } from '../types';
import { OperationType, handleFirestoreError } from '../utils/firebaseHelpers';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface UserManagementProps {
  currentUserRole: UserRole;
}

export default function UserManagement({ currentUserRole }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Omit<User, 'id'> })));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    };
    fetchUsers();
  }, []);

  const changeRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Management</h2>
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.map(user => (
            <li key={user.id} className="px-4 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                <p className="text-sm text-gray-500">Role: {user.role}</p>
              </div>
              {currentUserRole === 'ADMIN' && (
                <select
                  value={user.role}
                  onChange={(e) => changeRole(user.id, e.target.value as UserRole)}
                  className="border p-1 rounded"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="GUEST">Guest</option>
                </select>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

