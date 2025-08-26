import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InventoryCategory, CreateInventoryCategoryData, UpdateInventoryCategoryData } from '@/types/menu';

const API_BASE = '/api/inventory-categories';

// Get all inventory categories
export const useInventoryCategories = () => {
  return useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async (): Promise<InventoryCategory[]> => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error('Failed to fetch inventory categories');
      }
      return response.json();
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Create inventory category
export function useCreateInventoryCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateInventoryCategoryData): Promise<InventoryCategory> => {
      const response = await fetch(`${API_BASE}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create inventory category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch inventory categories
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });
}

// Update inventory category
export function useUpdateInventoryCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdateInventoryCategoryData): Promise<InventoryCategory> => {
      const { id, ...updateData } = data;
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update inventory category');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch inventory categories
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });
}

// Delete inventory category
export function useDeleteInventoryCategory() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (categoryId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${categoryId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete inventory category');
      }
    },
    onSuccess: () => {
      // Invalidate and refetch inventory categories
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] });
    },
  });
}
