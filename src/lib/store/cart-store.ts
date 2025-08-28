"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TransactionItem } from '@/types';

interface CartItem extends TransactionItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  taxAmount: number;
  discountAmount: number;
}

interface CartStore {
  items: CartItem[];
  customerId?: string;
  discountAmount: number;
  taxRate: number;
  
  // Actions
  addItem: (product: {
    id: string;
    name: string;
    price: number;
    taxRate: number;
    stockQuantity: number;
  }, quantity?: number) => void;
  
  updateItemQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  setCustomer: (customerId?: string) => void;
  setDiscount: (amount: number) => void;
  setTaxRate: (rate: number) => void;
  
  // Computed values
  subtotal: number;
  taxAmount: number;
  total: number;
  itemCount: number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customerId: undefined,
      discountAmount: 0,
      taxRate: 0.08, // Default 8% tax rate
      
      addItem: (product, quantity = 1) => {
        set((state) => {
          const existingItem = state.items.find(item => item.productId === product.id);
          
          if (existingItem) {
            // Update existing item quantity
            const newQuantity = existingItem.quantity + quantity;
            if (newQuantity > product.stockQuantity) {
              // Don't exceed stock
              return state;
            }
            
            const updatedItems = state.items.map(item =>
              item.productId === product.id
                ? {
                    ...item,
                    quantity: newQuantity,
                    totalPrice: newQuantity * item.unitPrice,
                    taxAmount: (newQuantity * item.unitPrice) * state.taxRate,
                  }
                : item
            );
            
            return { items: updatedItems };
          } else {
            // Add new item
            if (quantity > product.stockQuantity) {
              // Don't exceed stock
              return state;
            }
            
            const newItem: CartItem = {
              productId: product.id,
              productName: product.name,
              quantity,
              unitPrice: product.price,
              totalPrice: product.price * quantity,
              taxAmount: (product.price * quantity) * state.taxRate,
              discountAmount: 0,
            };
            
            return { items: [...state.items, newItem] };
          }
        });
      },
      
      updateItemQuantity: (productId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter(item => item.productId !== productId) };
          }
          
          const updatedItems = state.items.map(item =>
            item.productId === productId
              ? {
                  ...item,
                  quantity,
                  totalPrice: item.unitPrice * quantity,
                  taxAmount: (item.unitPrice * quantity) * state.taxRate,
                }
              : item
          );
          
          return { items: updatedItems };
        });
      },
      
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.productId !== productId)
        }));
      },
      
      clearCart: () => {
        set({
          items: [],
          customerId: undefined,
          discountAmount: 0,
        });
      },
      
      setCustomer: (customerId) => {
        set({ customerId });
      },
      
      setDiscount: (amount) => {
        set({ discountAmount: Math.max(0, amount) });
      },
      
      setTaxRate: (rate) => {
        set({ taxRate: rate });
      },
      
      get subtotal() {
        return get().items.reduce((sum, item) => sum + item.totalPrice, 0);
      },
      
      get taxAmount() {
        return get().items.reduce((sum, item) => sum + item.taxAmount, 0);
      },
      
      get total() {
        const { subtotal, taxAmount, discountAmount } = get();
        // Apply discount to subtotal first, then add tax (accounting standard)
        const subtotalAfterDiscount = Math.max(0, subtotal - discountAmount);
        return subtotalAfterDiscount + taxAmount;
      },
      
      get itemCount() {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
    }),
    {
      name: 'horder-cart',
      partialize: (state) => ({
        items: state.items,
        customerId: state.customerId,
        discountAmount: state.discountAmount,
        taxRate: state.taxRate,
      }),
    }
  )
);
