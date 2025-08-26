export interface Setting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: Date;
}

export interface SystemSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  taxRate: number;
  currency: string;
  receiptHeader: string;
  receiptFooter: string;
  autoBackup: boolean;
  backupInterval: number;
  printReceipts: boolean;
  requireCustomerInfo: boolean;
  loyaltyProgramEnabled: boolean;
  lowStockThreshold: number;
}

export interface CreateSettingData {
  key: string;
  value: string;
  description?: string;
}

export interface UpdateSettingData {
  value: string;
  description?: string;
}
