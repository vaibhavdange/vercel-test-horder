export interface Floor {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  areas: Area[];
  tables: Table[];
}

export interface Area {
  id: string;
  name: string;
  description?: string;
  floorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  floor: Floor;
  tables: Table[];
}

export interface Table {
  id: string;
  tableNumber: string;
  capacity: number;
  areaId: string;
  floorId: string;
  status: TableStatus;
  displayOrder: number; // New: Order for drag and drop positioning
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  area: Area;
  floor: Floor;
  orders: any[]; // Using any[] for now to avoid circular dependency
}

export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning' | 'unavailable';

export interface TableWithDetails extends Table {
  currentOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    totalAmount: number;
    createdAt: Date;
  };
}

export interface CreateFloorRequest {
  name: string;
  description?: string;
}

export interface UpdateFloorRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateAreaRequest {
  name: string;
  description?: string;
  floorId: string;
}

export interface UpdateAreaRequest {
  name?: string;
  description?: string;
  floorId?: string;
  isActive?: boolean;
}

export interface CreateTableRequest {
  tableNumber: string;
  capacity: number;
  areaId: string;
  floorId: string;
  displayOrder?: number; // Optional: Will be set automatically by frontend
}

export interface UpdateTableRequest {
  tableNumber?: string;
  capacity?: number;
  areaId?: string;
  floorId?: string;
  status?: TableStatus;
  displayOrder?: number; // New: Can update table order
  isActive?: boolean;
}

export interface TableStatusUpdateRequest {
  tableId: string;
  status: TableStatus;
}

export interface TableOrderUpdateRequest {
  tableOrders: Array<{
    id: string;
    displayOrder: number;
  }>;
}
