import { useQuery } from '@tanstack/react-query';

export interface ReportFilters {
  type: 'sales' | 'inventory' | 'customers' | 'financial' | 'products' | 'staff';
  dateFrom?: string;
  dateTo?: string;
  categoryId?: string;
  customerId?: string;
  paymentMethod?: string;
  status?: string;
}

export interface SalesReport {
  reportType: 'sales';
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalTax: number;
    totalDiscount: number;
  };
  orders: Array<{
    id: string;
    orderNumber: string;
    customerName?: string;
    totalAmount: number;
    status: string;
    createdAt: string;
  }>;
  salesByCategory: Array<{
    productId: string;
    _sum: {
      quantity: number;
      totalPrice: number;
    };
  }>;
  salesByPaymentMethod: Array<{
    paymentMethod: string;
    _sum: {
      totalAmount: number;
    };
    _count: {
      id: number;
    };
  }>;
  salesByStatus: Array<{
    status: string;
    _sum: {
      totalAmount: number;
    };
    _count: {
      id: number;
    };
  }>;
  dailySales: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export interface InventoryReport {
  reportType: 'inventory';
  summary: {
    totalProducts: number;
    totalStockValue: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  products: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    minStockLevel: number;
    price: number;
    category?: {
      name: string;
    };
  }>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stockQuantity: number;
    minStockLevel: number;
    category?: {
      name: string;
    };
  }>;
  outOfStockProducts: Array<{
    id: string;
    name: string;
    category?: {
      name: string;
    };
  }>;
  stockByCategory: Array<{
    categoryId: string;
    _sum: {
      stockQuantity: number;
    };
    _count: {
      id: number;
    };
  }>;
  topSellingProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
  }>;
}

export interface CustomerReport {
  reportType: 'customers';
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    averageCustomerValue: number;
  };
  customers: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    totalPurchases: number;
    loyaltyPoints: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    totalPurchases: number;
  }>;
  customerAcquisition: Array<{
    date: string;
    newCustomers: number;
  }>;
}

export interface FinancialReport {
  reportType: 'financial';
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalRevenue: number;
    totalCost: number;
    totalTax: number;
    totalDiscount: number;
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
  revenueByCategory: Array<{
    productId: string;
    _sum: {
      totalPrice: number;
    };
  }>;
  monthlyRevenue: Array<{
    date: string;
    revenue: number;
  }>;
}

export interface ProductReport {
  reportType: 'products';
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalProducts: number;
    totalRevenue: number;
    averageProductRevenue: number;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    stockQuantity: number;
    totalSold: number;
    totalRevenue: number;
    averageOrderSize: number;
    stockTurnover: number;
  }>;
  topPerformers: Array<{
    id: string;
    name: string;
    totalRevenue: number;
    totalSold: number;
  }>;
  lowPerformers: Array<{
    id: string;
    name: string;
    totalRevenue: number;
    totalSold: number;
  }>;
}

export interface StaffReport {
  reportType: 'staff';
  dateRange: {
    start: string;
    end: string;
  };
  summary: {
    totalStaff: number;
    totalTransactions: number;
    totalAmount: number;
  };
  staff: Array<{
    id: string;
    username: string;
    fullName: string;
    role: string;
    totalTransactions: number;
    totalAmount: number;
    averageTransactionValue: number;
  }>;
  topPerformers: Array<{
    id: string;
    username: string;
    fullName: string;
    totalAmount: number;
  }>;
}

export type ReportData = SalesReport | InventoryReport | CustomerReport | FinancialReport | ProductReport | StaffReport;

export function useReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['report', filters],
    queryFn: async (): Promise<ReportData> => {
      const params = new URLSearchParams();
      params.append('type', filters.type);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.paymentMethod) params.append('paymentMethod', filters.paymentMethod);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(`/api/reports?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      return response.json();
    },
    retry: 3,
  });
}
