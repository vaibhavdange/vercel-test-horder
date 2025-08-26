import { Product } from './product';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  parent?: Category;
  children?: Category[];
  products?: Product[];
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon: string;
  color?: string;
  parentId?: string;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  id: string;
}
