import { useQuery } from "@tanstack/react-query";

export interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'customer' | 'staff' | 'table' | 'recipe' | 'ingredient' | 'category' | 'reservation' | 'transaction' | 'setting' | 'billing-setting' | 'tax-category' | 'area' | 'floor' | 'attendance';
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  icon: string;
  highlightId?: string; // For scroll-to-highlight functionality
}

export interface GlobalSearchParams {
  query: string;
  limit?: number;
}

export function useGlobalSearch({ query, limit = 10 }: GlobalSearchParams) {
  return useQuery({
    queryKey: ['global-search', query, limit],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!query || query.length < 2) return [];
      
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to perform global search');
      }
      return response.json();
    },
    enabled: !!query && query.length >= 2,
    staleTime: 60_000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });
}
