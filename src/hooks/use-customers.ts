import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Customer, CreateCustomerData, UpdateCustomerData } from "@/types/orders";

const API_BASE = "/api/customers";

// Search customers
export const useSearchCustomers = (search?: string) => {
  return useQuery({
    queryKey: ["customers", "search", search],
    queryFn: async (): Promise<Customer[]> => {
      if (!search || search.length < 2) return [];
      
      const response = await fetch(`${API_BASE}?search=${encodeURIComponent(search)}`);
      if (!response.ok) {
        throw new Error("Failed to search customers");
      }
      return response.json();
    },
    enabled: !!search && search.length >= 2,
  });
};

// Find customer by phone
export const useCustomerByPhone = (phone?: string) => {
  return useQuery({
    queryKey: ["customers", "phone", phone],
    queryFn: async (): Promise<Customer | null> => {
      if (!phone) return null;
      
      const response = await fetch(`${API_BASE}?phone=${encodeURIComponent(phone)}`);
      if (!response.ok) {
        throw new Error("Failed to find customer");
      }
      const customers = await response.json();
      return customers[0] || null;
    },
    enabled: !!phone,
  });
};

// Create new customer
export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: CreateCustomerData): Promise<Customer> => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create customer");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};

// Update customer
export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customerData: UpdateCustomerData): Promise<Customer> => {
      const response = await fetch(`${API_BASE}/${customerData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update customer");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
};
