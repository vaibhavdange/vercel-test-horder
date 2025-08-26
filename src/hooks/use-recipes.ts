import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface RecipeItem {
  id?: string;
  ingredientId: string;
  quantity: number;
  unit: string;
  notes?: string;
  ingredient?: {
    id: string;
    name: string;
    unit: string;
    stockQuantity: number;
    minStockLevel: number;
    costPerUnit: number;
  };
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  productId: string;
  servings: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  product?: {
    id: string;
    name: string;
    category?: {
      name: string;
      icon: string;
    };
  };
  items: RecipeItem[];
}

export interface CreateRecipeData {
  name: string;
  description?: string;
  productId: string;
  servings?: number;
  items: Omit<RecipeItem, 'id' | 'ingredient'>[];
}

export interface UpdateRecipeData {
  name: string;
  description?: string;
  servings?: number;
  items: Omit<RecipeItem, 'id' | 'ingredient'>[];
}

export interface RecipeFilters {
  productId?: string;
  search?: string;
}

// Fetch recipes with optional filters
export function useRecipes(filters?: RecipeFilters) {
  const queryString = new URLSearchParams();
  if (filters?.productId) queryString.append('productId', filters.productId);
  if (filters?.search) queryString.append('search', filters.search);

  return useQuery({
    queryKey: ['recipes', filters],
    queryFn: async () => {
      const response = await fetch(`/api/recipes?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      return response.json() as Promise<Recipe[]>;
    },
  });
}

// Fetch a single recipe by ID
export function useRecipe(id: string) {
  return useQuery({
    queryKey: ['recipe', id],
    queryFn: async () => {
      const response = await fetch(`/api/recipes/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipe');
      }
      return response.json() as Promise<Recipe>;
    },
    enabled: !!id,
  });
}

// Create a new recipe
export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecipeData) => {
      const response = await fetch('/api/recipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create recipe');
      }

      return response.json() as Promise<Recipe>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

// Update an existing recipe
export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRecipeData }) => {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update recipe');
      }

      return response.json() as Promise<Recipe>;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['recipe', id] });
    },
  });
}

// Delete a recipe
export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete recipe');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
