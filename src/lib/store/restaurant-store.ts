"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  RestaurantSettings,
  DeviceConfig 
} from '@/types/restaurant';
import { Order, OrderItem } from '@/types/orders';
import { Table } from '@/types/tables';

// Define PaymentMethod interface for restaurant store
interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'e-wallet' | 'mobile' | 'wallet' | 'check' | 'gift_card';
  isActive: boolean;
  icon?: string;
}

// Extended Order interface for restaurant store compatibility
interface RestaurantOrder extends Order {
  items: OrderItem[];
  total: number;
  priority: 'normal' | 'urgent' | 'rush';
  kotPrinted: boolean;
  billPrinted: boolean;
  smsSent: boolean;
  startedPreparingAt?: Date;
  estimatedReadyAt?: Date;
  servedAt?: Date;
  paidAt?: Date;
}
import { getDefaultRegion } from '@/lib/data/regions';

interface RestaurantStore {
  // State
  tables: Table[];
  orders: RestaurantOrder[];
  currentOrder: RestaurantOrder | null;
  selectedTable: Table | null;
  orderType: 'dine-in' | 'takeaway' | null;
  paymentMethods: PaymentMethod[];
  settings: RestaurantSettings;
  
  // Actions
  // Table management
  addTable: (table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTable: (id: string, updates: Partial<Table>) => void;
  deleteTable: (id: string) => void;
  selectTable: (table: Table | null) => void;
  reserveTable: (tableId: string, customerName: string) => void;
  releaseTable: (tableId: string) => void;
  getTablesByStatus: (status: string) => Table[];
  
  // Order management
  createOrder: (orderData: Partial<RestaurantOrder>) => RestaurantOrder;
  updateOrder: (id: string, updates: Partial<RestaurantOrder>) => void;
  deleteOrder: (id: string) => void;
  addItemToOrder: (orderId: string, item: Omit<OrderItem, 'id'>) => void;
  removeItemFromOrder: (orderId: string, itemId: string) => void;
  updateOrderItem: (orderId: string, itemId: string, updates: Partial<OrderItem>) => void;
  setOrderStatus: (orderId: string, status: RestaurantOrder['status']) => void;
  setOrderPriority: (orderId: string, priority: RestaurantOrder['priority']) => void;
  
  // KOT management
  getKOTsByStatus: (status: RestaurantOrder['status']) => RestaurantOrder[];
  getUrgentKOTs: () => RestaurantOrder[];
  markKOTPrinted: (orderId: string) => void;
  markBillPrinted: (orderId: string) => void;
  markSMSSent: (orderId: string) => void;
  
  // Payment processing
  processPayment: (orderId: string, paymentMethod: PaymentMethod) => Promise<boolean>;
  openCashDrawer: () => Promise<boolean>;
  processCardPayment: (amount: number) => Promise<boolean>;
  processEWalletPayment: (amount: number, customerPhone: string) => Promise<boolean>;
  
  // Settings
  updateSettings: (updates: Partial<RestaurantSettings>) => void;
  updateDeviceConfig: (updates: Partial<DeviceConfig>) => void;
  
  // Computed values
  getAvailableTables: () => Table[];
  getOccupiedTables: () => Table[];
  getTotalOrders: () => number;
  getOrdersByStatus: (status: RestaurantOrder['status']) => RestaurantOrder[];
}

// Mock data for development
const mockTables: Table[] = [];

const mockPaymentMethods: PaymentMethod[] = [];

const defaultSettings: RestaurantSettings = {
  kot: {
    autoPrint: true,
    printFormat: 'thermal',
    includeNotes: true,
    includePreparationTime: true,
    defaultTaxRate: 0.08,
    allowCustomDiscounts: true,
    allowCustomTaxRates: true,
  },
  devices: {},
  preparationTimes: {},
  tableLayout: {
    rows: 4,
    columns: 4,
    spacing: 20,
  },
  region: getDefaultRegion(),
  billing: {
    invoicePrefix: 'INV',
    autoNumbering: true,
    includeLogo: true,
    includeQRCode: true,
    footerText: 'Thank you for your business!',
  },
  localization: {
    language: 'en',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
  },
};

export const useRestaurantStore = create<RestaurantStore>()(
  persist(
    (set, get) => ({
      // Initial state
      tables: mockTables,
      orders: [],
      currentOrder: null,
      selectedTable: null,
      orderType: null,
      paymentMethods: mockPaymentMethods,
      settings: defaultSettings,
      
      // Table management
      addTable: (tableData) => {
        const newTable: Table = {
          ...tableData,
          id: Date.now().toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        set((state) => ({
          tables: [...state.tables, newTable],
        }));
      },
      
      updateTable: (id, updates) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id ? { ...table, ...updates, updatedAt: new Date() } : table
          ),
        }));
      },
      
      deleteTable: (id) => {
        set((state) => ({
          tables: state.tables.filter((table) => table.id !== id),
        }));
      },
      
      selectTable: (table) => {
        set({ selectedTable: table });
      },
      
      reserveTable: (tableId, customerName) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId
              ? { ...table, status: 'reserved', updatedAt: new Date() }
              : table
          ),
        }));
      },
      
      releaseTable: (tableId) => {
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId
              ? { ...table, status: 'available', currentOrderId: undefined, updatedAt: new Date() }
              : table
          ),
        }));
      },

      getTablesByStatus: (status: string) => {
        const state = get();
        return state.tables.filter((table) => table.status === status);
      },
      
      // Order management
      createOrder: (orderData) => {
        if (!orderData.orderType) {
          throw new Error('Order type is required');
        }
        
        const newOrder: RestaurantOrder = {
          id: Date.now().toString(),
          orderNumber: `ORD-${Date.now()}`,
          kotNumber: undefined,
          orderType: orderData.orderType,
          tableNumber: orderData.tableNumber,
          customerId: orderData.customerId,
          customerName: orderData.customerName,
          customerPhone: orderData.customerPhone,
          status: 'pending',
          subStatus: undefined,
          subtotal: 0,
          taxAmount: 0,
          serviceChargeAmount: 0,
          serviceChargeRate: 0,
          discountAmount: 0,
          totalAmount: 0,
          paymentStatus: 'pending',
          paymentMethod: undefined,
          notes: orderData.notes,
          createdAt: new Date().toISOString(),
          startedCookingAt: undefined,
          readyAt: undefined,
          updatedAt: new Date().toISOString(),
          customer: undefined,
          orderItems: [],
          // Restaurant store specific properties
          items: [],
          total: 0,
          priority: 'normal',
          kotPrinted: false,
          billPrinted: false,
          smsSent: false,
          startedPreparingAt: undefined,
          estimatedReadyAt: undefined,
          servedAt: undefined,
          paidAt: undefined,
          ...orderData,
        };
        
        set((state) => ({
          orders: [...state.orders, newOrder],
          currentOrder: newOrder,
        }));
        
        return newOrder;
      },
      
      updateOrder: (id, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === id ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order
          ),
          currentOrder: state.currentOrder?.id === id 
            ? { ...state.currentOrder, ...updates, updatedAt: new Date().toISOString() }
            : state.currentOrder,
        }));
      },
      
      deleteOrder: (id) => {
        set((state) => ({
          orders: state.orders.filter((order) => order.id !== id),
          currentOrder: state.currentOrder?.id === id ? null : state.currentOrder,
        }));
      },
      
      addItemToOrder: (orderId, itemData) => {
        const newItem: OrderItem = {
          id: Date.now().toString(),
          orderId,
          productId: itemData.productId,
          productName: itemData.productName,
          quantity: itemData.quantity,
          unitPrice: itemData.unitPrice,
          totalPrice: itemData.totalPrice,
          customizationNotes: itemData.customizationNotes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          product: undefined,
        };
        
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: [...order.items, newItem],
                  orderItems: [...order.orderItems, newItem],
                  subtotal: order.items.reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) + newItem.totalPrice,
                  taxAmount: (order.items.reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) + newItem.totalPrice) * state.settings.kot.defaultTaxRate,
                  total: (order.items.reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) + newItem.totalPrice) * (1 + state.settings.kot.defaultTaxRate),
                  totalAmount: (order.items.reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) + newItem.totalPrice) * (1 + state.settings.kot.defaultTaxRate),
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));
      },
      
      removeItemFromOrder: (orderId, itemId) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.filter((item) => item.id !== itemId),
                  orderItems: order.orderItems.filter((item) => item.id !== itemId),
                  subtotal: order.items.filter((item) => item.id !== itemId).reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0),
                  taxAmount: order.items.filter((item) => item.id !== itemId).reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) * state.settings.kot.defaultTaxRate,
                  total: order.items.filter((item) => item.id !== itemId).reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) * (1 + state.settings.kot.defaultTaxRate),
                  totalAmount: order.items.filter((item) => item.id !== itemId).reduce((sum: number, item: OrderItem) => sum + item.totalPrice, 0) * (1 + state.settings.kot.defaultTaxRate),
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));
      },
      
      updateOrderItem: (orderId, itemId, updates) => {
        set((state) => ({
          orders: state.orders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.map((item: OrderItem) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                  orderItems: order.orderItems.map((item: OrderItem) =>
                    item.id === itemId ? { ...item, ...updates } : item
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : order
          ),
        }));
      },
      
      setOrderStatus: (orderId, status) => {
        const now = new Date();
        const updates: Partial<RestaurantOrder> = { status, updatedAt: now.toISOString() };
        
        if (status === 'in-process') {
          updates.startedPreparingAt = now;
        } else if (status === 'ready') {
          updates.readyAt = now.toISOString();
        } else if (status === 'completed') {
          updates.servedAt = now;
        }
        
        get().updateOrder(orderId, updates);
      },
      
      setOrderPriority: (orderId, priority) => {
        get().updateOrder(orderId, { priority });
      },
      
      // KOT management
      getKOTsByStatus: (status) => {
        return get().orders.filter((order) => order.status === status);
      },
      
      getUrgentKOTs: () => {
        return get().orders.filter((order) => order.priority === 'urgent' || order.priority === 'rush');
      },
      
      markKOTPrinted: (orderId) => {
        get().updateOrder(orderId, { kotPrinted: true });
      },
      
      markBillPrinted: (orderId) => {
        get().updateOrder(orderId, { billPrinted: true });
      },
      
      markSMSSent: (orderId) => {
        get().updateOrder(orderId, { smsSent: true });
      },
      
      // Payment processing
      processPayment: async (orderId, paymentMethod) => {
        try {
          const order = get().orders.find((o) => o.id === orderId);
          if (!order) return false;
          
          // Process payment based on method
          switch (paymentMethod.type) {
            case 'cash':
              await get().openCashDrawer();
              break;
            case 'card':
              await get().processCardPayment(order.totalAmount);
              break;
            case 'e-wallet':
              if (order.customerPhone) {
                await get().processEWalletPayment(order.totalAmount, order.customerPhone);
              }
              break;
          }
          
          // Update order status
          get().setOrderStatus(orderId, 'completed');
          return true;
        } catch (error) {
          console.error('Payment processing failed:', error);
          return false;
        }
      },
      
      openCashDrawer: async () => {
        // TODO: Implement actual cash drawer communication
        console.log('Opening cash drawer...');
        return true;
      },
      
      processCardPayment: async (amount) => {
        // TODO: Implement actual card machine communication
        console.log(`Processing card payment for $${amount}`);
        return true;
      },
      
      processEWalletPayment: async (amount, customerPhone) => {
        // TODO: Implement actual e-wallet API communication
        console.log(`Processing e-wallet payment for $${amount} to ${customerPhone}`);
        return true;
      },
      
      // Settings
      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },
      
      updateDeviceConfig: (updates) => {
        set((state) => ({
          settings: {
            ...state.settings,
            devices: { ...state.settings.devices, ...updates },
          },
        }));
      },
      
      // Computed values
      getAvailableTables: () => {
        return get().tables.filter((table) => table.status === 'available');
      },
      
      getOccupiedTables: () => {
        return get().tables.filter((table) => table.status === 'occupied');
      },
      
      getTotalOrders: () => {
        return get().orders.length;
      },
      
      getOrdersByStatus: (status) => {
        return get().orders.filter((order) => order.status === status);
      },
    }),
    {
      name: 'horder-restaurant',
      partialize: (state) => ({
        tables: state.tables,
        orders: state.orders,
        paymentMethods: state.paymentMethods,
        settings: state.settings,
      }),
    }
  )
);
