import { Product } from './product';

export interface CartAddon {
  id: string;
  name: string;
  price: number;
}

export interface CartVariant {
  id: string;
  name: string;
  price: number;
}

export interface CartItem {
  key: string; // unique combination identifier
  productId: string;
  productName: string;
  basePrice: number;
  quantity: number;
  addons: CartAddon[];
  variant?: CartVariant;
  totalPrice: number;
  customizationNotes?: string;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  total: number;
}
