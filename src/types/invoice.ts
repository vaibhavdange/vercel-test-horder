export interface InvoiceItem {
  id: string;
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  hsnCode: string;
  taxSlab: number;
  taxAmount: number;
  lineTotal: number;
}

export interface TaxSummary {
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalTaxAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  restaurantId: string;
  customerName: string;
  customerGstin?: string;
  customerAddress?: string;
  customerPhone?: string;
  invoiceDate: Date;
  items: InvoiceItem[];
  taxSummary: TaxSummary;
  subtotal: number;
  discount: number;
  totalAmount: number;
  paymentMethod: string;
  status: 'draft' | 'finalized' | 'paid' | 'cancelled';
  orderId?: string;
  tableNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInvoiceData {
  restaurantId: string;
  customerName: string;
  customerGstin?: string;
  customerAddress?: string;
  customerPhone?: string;
  items: Omit<InvoiceItem, 'id' | 'taxAmount' | 'lineTotal'>[];
  discount?: number;
  paymentMethod: string;
  orderId?: string;
  tableNumber?: string;
  notes?: string;
}

export interface UpdateInvoiceData {
  customerName?: string;
  customerGstin?: string;
  customerAddress?: string;
  customerPhone?: string;
  items?: Omit<InvoiceItem, 'id' | 'taxAmount' | 'lineTotal'>[];
  discount?: number;
  paymentMethod?: string;
  notes?: string;
}

export interface InvoiceFilters {
  startDate?: Date;
  endDate?: Date;
  status?: Invoice['status'];
  customerName?: string;
  restaurantId?: string;
}

// GST-specific types
export interface GSTRate {
  rate: number;
  description: string;
  isActive: boolean;
}

export interface GSTSlab {
  id: string;
  name: string;
  rate: number;
  appliesTo: 'all' | 'food' | 'beverages' | 'services';
  isActive: boolean;
}

export interface RestaurantGSTInfo {
  restaurantId: string;
  gstin: string;
  stateCode: string;
  stateName: string;
  isInterState: boolean;
  gstSlabs: GSTSlab[];
}

// Export formats
export type ExportFormat = 'pdf' | 'excel' | 'json';

export interface ExportOptions {
  format: ExportFormat;
  includeLogo?: boolean;
  includeQRCode?: boolean;
  template?: string;
}
