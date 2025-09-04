import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RestaurantSettings, UpdateRestaurantSettingsRequest } from "@/types/orders";

const API_BASE = "/api/settings/restaurant";

// Fetch restaurant settings
export const useRestaurantSettings = () => {
  return useQuery({
    queryKey: ["restaurant-settings"],
    queryFn: async (): Promise<RestaurantSettings> => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        throw new Error("Failed to fetch restaurant settings");
      }
      return response.json();
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Update restaurant settings
export const useUpdateRestaurantSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateRestaurantSettingsRequest): Promise<RestaurantSettings> => {
      const response = await fetch(API_BASE, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update restaurant settings");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant-settings"] });
      // Also invalidate billing settings queries for backward compatibility
      queryClient.invalidateQueries({ queryKey: ["billing-settings"] });
    },
  });
};

// Get business details (backward compatibility)
export const useBusinessDetails = () => {
  return useQuery({
    queryKey: ["restaurant-settings", "business-details"],
    queryFn: async () => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        // Return default values if not found
        return {
          restaurantName: "BORDERS RESTO & PUB",
          address: "123, Example St., Delhi, 112234",
          phone: "9012345678",
          email: "hello@borderspub.com",
          website: "www.borderspub.in",
          fssai: "11223344556677",
          gstin: "27ABCDE1234F1Z5",
        };
      }
      const settings = await response.json();
      return {
        restaurantName: settings.restaurantname || "BORDERS RESTO & PUB",
        address: settings.addresslineone || "123, Example St., Delhi, 112234",
        phone: settings.restaurantphone || "9012345678",
        email: settings.restaurantemail || "hello@borderspub.com",
        website: settings.restaurantwebsite || "www.borderspub.in",
        fssai: settings.restaurantfssai || "11223344556677",
        gstin: settings.restaurantgst || "27ABCDE1234F1Z5",
      };
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Get default tax rate (backward compatibility)
export const useDefaultTaxRate = () => {
  return useQuery({
    queryKey: ["restaurant-settings", "default-tax-rate"],
    queryFn: async (): Promise<number> => {
      const response = await fetch(API_BASE);
      if (!response.ok) {
        return 18; // Default 18% tax
      }
      const settings = await response.json();
      return settings.restaurantgstrate || 18;
    },
    staleTime: 30000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};
