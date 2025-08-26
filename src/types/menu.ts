export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  parentId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stockItems?: StockItem[];
}

export interface StockItem {
  id: string;
  name: string;
  description?: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier?: string;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: InventoryCategory;
  categoryId?: string;
}

export interface CreateInventoryCategoryData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateInventoryCategoryData extends Partial<CreateInventoryCategoryData> {
  id: string;
}

export interface CreateStockItemData {
  name: string;
  description?: string;
  unit: string;
  costPerUnit: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier?: string;
  location?: string;
  categoryId?: string;
}

export interface UpdateStockItemData extends Partial<CreateStockItemData> {
  id: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stockQuantity: number;
  minStockLevel: number;
  taxRate: number;
  image?: string;
  thumbnail?: string; // New: Thumbnail image path
  barcode?: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    icon: string;
  };
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
  parentId?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}

export interface CreateProductData {
  name: string;
  description?: string;
  price: number;
  cost?: number;
  stockQuantity?: number;
  minStockLevel?: number;
  taxRate?: number;
  image?: string;
  thumbnail?: string; // New: Thumbnail image path
  barcode?: string;
  categoryId: string;
  isActive?: boolean;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string;
}
