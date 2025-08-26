import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StockItem, CreateStockItemData, UpdateStockItemData } from '@/types/menu';

const API_BASE = '/api/ingredients';

export interface StockItemFilters {
  categoryId?: string;
  search?: string;
  stockFilter?: 'LowStock' | 'OutOfStock' | 'InStock';
}

// Fetch stock items
export function useStockItems(filters: StockItemFilters = {}) {
  return useQuery({
    queryKey: ['stock-items', filters],
    queryFn: async (): Promise<StockItem[]> => {
      const params = new URLSearchParams();
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.search) params.append('search', filters.search);
      if (filters.stockFilter) params.append('stockFilter', filters.stockFilter);

      const response = await fetch(`${API_BASE}?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch stock items');
      }
      return response.json();
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}

// Create stock item
export function useCreateStockItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateStockItemData): Promise<StockItem> => {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create stock item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch stock items
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
    },
  });
}

// Update stock item
export function useUpdateStockItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateStockItemData): Promise<StockItem> => {
      const response = await fetch(`${API_BASE}/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stock item');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch stock items
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
    },
  });
}

// Delete stock item
export function useDeleteStockItem() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete stock item');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch stock items
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
    },
  });
}
