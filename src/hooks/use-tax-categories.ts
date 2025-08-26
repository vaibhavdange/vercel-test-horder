import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaxCategory, CreateTaxCategoryData, UpdateTaxCategoryData } from "@/types/orders";

const API_BASE = "/api/tax-categories";

// Fetch tax categories with optional filters
export const useTaxCategories = (filters?: { search?: string; activeOnly?: boolean }) => {
  const queryString = new URLSearchParams();
  
  if (filters?.search) queryString.append("search", filters.search);
  if (filters?.activeOnly) queryString.append("activeOnly", "true");

  const url = `${API_BASE}?${queryString.toString()}`;

  return useQuery({
    queryKey: ["tax-categories", filters],
    queryFn: async (): Promise<TaxCategory[]> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch tax categories");
      }
      return response.json();
    },
  });
};

// Fetch single tax category by ID
export const useTaxCategory = (id: string) => {
  return useQuery({
    queryKey: ["tax-categories", id],
    queryFn: async (): Promise<TaxCategory> => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch tax category");
      }
      return response.json();
    },
    enabled: !!id,
  });
};

// Create new tax category
export const useCreateTaxCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaxCategoryData): Promise<TaxCategory> => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create tax category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-categories"] });
    },
  });
};

// Update tax category
export const useUpdateTaxCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaxCategoryData }): Promise<TaxCategory> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update tax category");
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["tax-categories"] });
      queryClient.invalidateQueries({ queryKey: ["tax-categories", id] });
    },
  });
};

// Delete tax category
export const useDeleteTaxCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete tax category");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tax-categories"] });
    },
  });
};
