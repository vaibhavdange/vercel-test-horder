import { User } from './user';
import { Customer } from './customer';

export interface TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
}

export interface RefundedItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  refundReason?: string;
}

export interface Refund {
  id: string;
  refundNumber: string;
  orderId: string;
  transactionId: string;
  refundAmount: number;
  refundReason?: string;
  refundMethod: RefundMethod;
  refundStatus: RefundStatus;
  cashierId?: string;
  customerId?: string;
  refundDate: Date;
  refundedItems?: string; // JSON string of RefundedItem[]
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  cashier?: User;
  customer?: Customer;
}

export interface CreateRefundData {
  orderId: string;
  transactionId: string;
  refundAmount: number;
  refundReason?: string;
  refundMethod: RefundMethod;
  refundedItems: RefundedItem[];
  notes?: string;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  cashierId?: string;
  customerId?: string;
  transactionDate: Date;
  items: string; // JSON string of TransactionItem[]
  createdAt: Date;
  updatedAt: Date;
  cashier?: User;
  customer?: Customer;
}

export interface CreateTransactionData {
  items: TransactionItem[];
  paymentMethod: PaymentMethod;
  customerId?: string;
  discountAmount?: number;
}

export type PaymentMethod = 'cash' | 'card' | 'mobile' | 'wallet' | 'check' | 'gift_card';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'voided';
export type RefundMethod = 'cash' | 'card' | 'voucher' | 'store_credit';
export type RefundStatus = 'pending' | 'processed' | 'completed' | 'failed';

export interface TransactionSearchParams {
  startDate?: Date;
  endDate?: Date;
  paymentMethod?: PaymentMethod;
  paymentStatus?: PaymentStatus;
  cashierId?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface RefundSearchParams {
  startDate?: Date;
  endDate?: Date;
  refundMethod?: RefundMethod;
  refundStatus?: RefundStatus;
  cashierId?: string;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
}
