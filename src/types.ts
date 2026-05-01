export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type RoomStatus = 'AVAILABLE' | 'OCCUPIED' | 'DIRTY' | 'MAINTENANCE' | 'BOOKED';


export type UserRole = 'ADMIN' | 'STAFF' | 'GUEST';

export interface Room {
  id: string;
  number: string;
  type: string;
  priceTier: number;
  status: RoomStatus;
}

export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

export interface Guest {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  preferences: string[];
}

export interface FirestoreErrorInfo {
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
