import { Transaction } from './transaction';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Transaction[];
}

export interface CreateUserData {
  username: string;
  password: string;
  fullName: string;
  role?: UserRole;
}

export interface UpdateUserData {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface LoginData {
  username: string;
  password: string;
}

export type UserRole = 'admin' | 'manager' | 'cashier';

export interface UserPermissions {
  canManageProducts: boolean;
  canManageInventory: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canProcessRefunds: boolean;
  canManageCustomers: boolean;
  canManageSettings: boolean;
}
