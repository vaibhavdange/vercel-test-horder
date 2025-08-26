"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, UserPermissions } from '@/types';

interface UserStore {
  user: User | null;
  isAuthenticated: boolean;
  permissions: UserPermissions;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePermissions: (permissions: Partial<UserPermissions>) => void;
  
  // Computed values
  canManageProducts: boolean;
  canManageInventory: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canProcessRefunds: boolean;
  canManageCustomers: boolean;
  canManageSettings: boolean;
}

// Default permissions based on role
const getDefaultPermissions = (role: UserRole): UserPermissions => {
  switch (role) {
    case 'admin':
      return {
        canManageProducts: true,
        canManageInventory: true,
        canManageUsers: true,
        canViewReports: true,
        canProcessRefunds: true,
        canManageCustomers: true,
        canManageSettings: true,
      };
    case 'manager':
      return {
        canManageProducts: true,
        canManageInventory: true,
        canManageUsers: false,
        canViewReports: true,
        canProcessRefunds: true,
        canManageCustomers: true,
        canManageSettings: false,
      };
    case 'cashier':
      return {
        canManageProducts: false,
        canManageInventory: false,
        canManageUsers: false,
        canViewReports: false,
        canProcessRefunds: false,
        canManageCustomers: false,
        canManageSettings: false,
      };
    default:
      return {
        canManageProducts: false,
        canManageInventory: false,
        canManageUsers: false,
        canViewReports: false,
        canProcessRefunds: false,
        canManageCustomers: false,
        canManageSettings: false,
      };
  }
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      permissions: {
        canManageProducts: false,
        canManageInventory: false,
        canManageUsers: false,
        canViewReports: false,
        canProcessRefunds: false,
        canManageCustomers: false,
        canManageSettings: false,
      },
      
      login: (user: User) => {
        const permissions = getDefaultPermissions(user.role);
        set({
          user: {
            ...user,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt),
            lastLogin: user.lastLogin ? new Date(user.lastLogin) : undefined,
          },
          isAuthenticated: true,
          permissions,
        });
      },
      
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          permissions: {
            canManageProducts: false,
            canManageInventory: false,
            canManageUsers: false,
            canViewReports: false,
            canProcessRefunds: false,
            canManageCustomers: false,
            canManageSettings: false,
          },
        });
      },
      
      updateUser: (updates: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        }));
      },
      
      updatePermissions: (permissions: Partial<UserPermissions>) => {
        set((state) => ({
          permissions: { ...state.permissions, ...permissions },
        }));
      },
      
      get canManageProducts() {
        return get().permissions.canManageProducts;
      },
      
      get canManageInventory() {
        return get().permissions.canManageInventory;
      },
      
      get canManageUsers() {
        return get().permissions.canManageUsers;
      },
      
      get canViewReports() {
        return get().permissions.canViewReports;
      },
      
      get canProcessRefunds() {
        return get().permissions.canProcessRefunds;
      },
      
      get canManageCustomers() {
        return get().permissions.canManageCustomers;
      },
      
      get canManageSettings() {
        return get().permissions.canManageSettings;
      },
    }),
    {
      name: 'horder-user',
      partialize: (state) => ({
        user: state.user ? {
          ...state.user,
          createdAt: state.user.createdAt.toISOString(),
          updatedAt: state.user.updatedAt.toISOString(),
          lastLogin: state.user.lastLogin?.toISOString(),
        } : null,
        isAuthenticated: state.isAuthenticated,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.user) {
          state.user.createdAt = new Date(state.user.createdAt);
          state.user.updatedAt = new Date(state.user.updatedAt);
          if (state.user.lastLogin) {
            state.user.lastLogin = new Date(state.user.lastLogin);
          }
        }
      },
    }
  )
);
