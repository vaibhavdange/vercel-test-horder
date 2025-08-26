import { useQuery } from '@tanstack/react-query';

export interface AnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    totalTax: number;
    totalDiscount: number;
    activeTables: number;
  };
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
  popularProducts: Array<{
    productId: string;
    productName: string;
    totalQuantity: number;
    totalRevenue: number;
    image: string | null;
    thumbnail: string | null;
    categoryId: string | null;
  }>;
  inventory: {
    totalProducts: number;
    totalStock: number;
            lowStockProducts: Array<{
          id: string;
          name: string;
          currentStock: number;
          minStockLevel: number;
          category: string;
          image: string | null;
          thumbnail: string | null;
          categoryId: string | null;
        }>;
  };
  chartData: {
    dailySales: Array<{
      date: string;
      sales: number;
    }>;
  };
}

export function useAnalytics(period: string = 'month', dateFrom?: string, dateTo?: string) {
  return useQuery<AnalyticsData>({
    queryKey: ['analytics', period, dateFrom, dateTo],
    queryFn: async (): Promise<AnalyticsData> => {
      const params = new URLSearchParams();
      params.append('period', period);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);
      
      const response = await fetch(`/api/analytics?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      return response.json();
    },
    // Near real-time refresh and background updates
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchOnMount: true,
    staleTime: 0,
    retry: 3,
  });
}
