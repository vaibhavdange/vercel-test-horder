export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerData {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {
  id: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizationNotes?: string;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    price: number;
    category?: {
      id: string;
      name: string;
      icon: string;
    };
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  kotNumber?: number;
  orderType: "dine-in" | "takeaway" | "delivery";
  tableId?: string;
  tableNumber?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  status: "pending" | "in-process" | "ready" | "completed" | "cancelled" | "out-for-delivery" | "delivered";
  subStatus?: string;
  subtotal: number;
  taxAmount: number;
  serviceChargeAmount: number; // New: Service charge amount
  serviceChargeRate: number;   // New: Service charge percentage
  discountAmount: number;
  totalAmount: number;
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  startedCookingAt?: string;
  readyAt?: string;
  updatedAt: string;
  customer?: Customer;
  orderItems?: OrderItem[];
}

export interface CreateOrderData {
  orderType: "dine-in" | "takeaway" | "delivery";
  tableId?: string;
  tableNumber?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  status?: "pending" | "in-process" | "ready" | "completed" | "cancelled" | "out-for-delivery" | "delivered";
  subStatus?: string;
  subtotal: number;
  taxAmount?: number;
  serviceChargeAmount?: number; // New: Service charge amount
  serviceChargeRate?: number;   // New: Service charge percentage
  discountAmount?: number;
  totalAmount: number;
  paymentStatus?: "pending" | "paid" | "refunded";
  paymentMethod?: string;
  notes?: string;
  orderItems?: CreateOrderItemData[];
}

export interface CreateOrderItemData {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizationNotes?: string;
}

export interface UpdateOrderData extends Partial<CreateOrderData> {
  // id is not needed here since it's specified in the URL when updating
}

export interface OrderFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  customerId?: string;
}

// New types for advanced billing
export interface TaxCategory {
  id: string;
  name: string;
  description?: string;
  taxRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillingSettings {
  id: string;
  key: string;
  value: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaxCategoryData {
  name: string;
  description?: string;
  taxRate: number;
  isActive?: boolean;
}

export interface UpdateTaxCategoryData extends Partial<CreateTaxCategoryData> {
  // id is not needed here since it's passed separately to the update function
}
