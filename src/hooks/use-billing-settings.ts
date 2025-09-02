import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BillingSettings } from "@/types/orders";

const API_BASE = "/api/billing-settings";

// Fetch billing settings with optional filters
export const useBillingSettings = (filters?: { key?: string; activeOnly?: boolean }) => {
  const queryString = new URLSearchParams();
  
  if (filters?.key) queryString.append("key", filters.key);
  if (filters?.activeOnly) queryString.append("activeOnly", "true");

  const url = `${API_BASE}?${queryString.toString()}`;

  return useQuery({
    queryKey: ["billing-settings", filters],
    queryFn: async (): Promise<BillingSettings[]> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch billing settings");
      }
      return response.json();
    },
  });
};

// Create new billing setting
export const useCreateBillingSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { key: string; value: any; description?: string; isActive?: boolean }): Promise<BillingSettings> => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create billing setting");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-settings"] });
    },
  });
};

// Update existing billing setting
export const useUpdateBillingSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; data: { value: any; description?: string; isActive?: boolean } }): Promise<BillingSettings> => {
      const response = await fetch(`${API_BASE}/${data.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data.data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update billing setting");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-settings"] });
    },
  });
};

// Get default service charge rate
export const useDefaultServiceChargeRate = () => {
  return useQuery({
    queryKey: ["billing-settings", "default_service_charge_rate"],
    queryFn: async (): Promise<number> => {
      const response = await fetch(`${API_BASE}?key=default_service_charge_rate`);
      if (!response.ok) {
        return 0.10; // Default 10% service charge
      }
      const settings = await response.json();
      return settings.length > 0 ? parseFloat(settings[0].value) : 0.10;
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Get default tax rate
export const useDefaultTaxRate = () => {
  return useQuery({
    queryKey: ["billing-settings", "default_tax_rate"],
    queryFn: async (): Promise<number> => {
      const response = await fetch(`${API_BASE}?key=default_tax_rate`);
      if (!response.ok) {
        return 0.08; // Default 8% tax
      }
      const settings = await response.json();
      return settings.length > 0 ? parseFloat(settings[0].value) : 0.08;
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Get default alcohol tax rate (VAT/Excise)
export const useDefaultAlcoholTaxRate = () => {
  return useQuery({
    queryKey: ["billing-settings", "default_alcohol_tax_rate"],
    queryFn: async (): Promise<number> => {
      const response = await fetch(`${API_BASE}?key=default_alcohol_tax_rate`);
      if (!response.ok) {
        return 18; // Default 18% VAT for alcohol
      }
      const settings = await response.json();
      let value = settings.length > 0 ? parseFloat(settings[0].value) : 18;
      // If value is <= 1, assume it's a fraction and convert to percentage
      if (value <= 1) value = value * 100;
      return value;
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Whether product-level tax can be configured on products
export const useProductLevelTaxEnabled = () => {
  return useQuery({
    queryKey: ["billing-settings", "product_level_tax_enabled"],
    queryFn: async (): Promise<boolean> => {
      const response = await fetch(`${API_BASE}?key=product_level_tax_enabled`);
      if (!response.ok) {
        return false; // Disabled by default
      }
      const settings = await response.json();
      if (!Array.isArray(settings) || settings.length === 0) return false;
      return String(settings[0].value) === 'true';
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
