import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const API_BASE = '/api/products';

export const useProductVariants = (productId: string) => {
  return useQuery({
    queryKey: ['product-variants', productId],
    queryFn: async (): Promise<any[]> => {
      const response = await fetch(`${API_BASE}/${productId}/variants`);
      if (!response.ok) {
        throw new Error('Failed to fetch product variants');
      }
      return response.json();
    },
    enabled: !!productId,
    staleTime: 30000,
  });
};

export const useCreateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, variantData }: { productId: string; variantData: { name: string; price: number } }) => {
      const response = await fetch(`${API_BASE}/${productId}/variants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product variant');
      }

      return response.json();
    },
    onSuccess: (data, { productId }) => {
      // Invalidate and refetch product variants
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      // Also invalidate products to refresh the product with variants
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useUpdateProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      variantId, 
      variantData 
    }: { 
      productId: string; 
      variantId: string; 
      variantData: { name: string; price: number; isActive?: boolean } 
    }) => {
      const response = await fetch(`${API_BASE}/${productId}/variants/${variantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(variantData),
      });

      if (!response.ok) {
        throw new Error('Failed to update product variant');
      }

      return response.json();
    },
    onSuccess: (data, { productId }) => {
      // Invalidate and refetch product variants
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      // Also invalidate products to refresh the product with variants
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};

export const useDeleteProductVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      variantId 
    }: { 
      productId: string; 
      variantId: string; 
    }) => {
      const response = await fetch(`${API_BASE}/${productId}/variants/${variantId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete product variant');
      }

      return response.json();
    },
    onSuccess: (data, { productId }) => {
      // Invalidate and refetch product variants
      queryClient.invalidateQueries({ queryKey: ['product-variants', productId] });
      // Also invalidate products to refresh the product with variants
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
};
