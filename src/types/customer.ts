import { Transaction } from './transaction';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  createdAt: Date;
  updatedAt: Date;
  transactions?: Transaction[];
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface CustomerSearchParams {
  query?: string;
  hasLoyaltyPoints?: boolean;
  minTotalPurchases?: number;
  maxTotalPurchases?: number;
}
