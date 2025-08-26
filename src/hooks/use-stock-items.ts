import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StockItem, CreateStockItemData, UpdateStockItemData } from '@/types/menu';

const API_BASE = '/api/stock-items';

interface UseStockItemsOptions {
  categoryId?: string;
  search?: string;
  stockFilter?: string;
}

// Fetch all stock items with optional filtering
export function useStockItems(options: UseStockItemsOptions = {}) {
  const { categoryId, search, stockFilter } = options;
  
  return useQuery({
    queryKey: ['stock-items', categoryId, search, stockFilter],
    queryFn: async (): Promise<StockItem[]> => {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (search) params.append('search', search);
      if (stockFilter) params.append('stockFilter', stockFilter);
      
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
      const response = await fetch(`${API_BASE}`, {
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
      const { id, ...updateData } = data;
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
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
    mutationFn: async (stockItemId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${stockItemId}`, {
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

// Update stock quantity
export function useUpdateStockQuantity() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }): Promise<StockItem> => {
      const response = await fetch(`${API_BASE}/${id}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update stock quantity');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch stock items
      queryClient.invalidateQueries({ queryKey: ['stock-items'] });
    },
  });
}
