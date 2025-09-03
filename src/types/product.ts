import { Category } from "./category";
import { TaxCategory } from "./settings";

export interface ProductExtra {
  id: string;
  name: string;
  price: number;
  stockItemId?: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
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
  isAlcohol?: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
  taxCategory?: TaxCategory;
  extras?: ProductExtra[];
  variants?: ProductVariant[];
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
  image?: string;
  thumbnail?: string;
  isActive?: boolean;
  isAlcohol?: boolean;
  extras?: Array<{ name: string; price: number; stockItemId?: string }>;
  variants?: Array<{ name: string; price: number }>;
}

export interface UpdateProductData {
  id: string;
  barcode?: string;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  categoryId?: string;
  stockQuantity?: number;
  minStockLevel?: number;
  taxRate?: number;
  taxCategoryId?: string;
  serviceChargeRate?: number;
  image?: string;
  thumbnail?: string;
  isActive?: boolean;
  isAlcohol?: boolean;
  extras?: Array<{ name: string; price: number; stockItemId?: string }>;
  variants?: Array<{ name: string; price: number }>;
}

export interface ProductSearchParams {
  query?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}
