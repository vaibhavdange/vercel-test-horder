import { Category } from './category';
import { TaxCategory } from './orders';

export interface ProductExtra {
  id: string;
  productId: string;
  stockItemId?: string;
  name: string;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  stockQuantity: number;
  minStockLevel: number;
  taxRate: number;
  taxCategoryId?: string;
  serviceChargeRate: number;
  image?: string;
  thumbnail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  taxCategory?: TaxCategory;
  extras?: ProductExtra[];
}

export interface CreateProductData {
  barcode?: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  categoryId?: string;
  stockQuantity: number;
  minStockLevel: number;
  taxRate?: number;
  taxCategoryId?: string;
  serviceChargeRate?: number;
  extras?: Array<{ name: string; price: number; stockItemId?: string }>;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
  isActive?: boolean;
}

export interface ProductSearchParams {
  query?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}
