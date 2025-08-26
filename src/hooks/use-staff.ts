import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Staff, CreateStaffData, UpdateStaffData, StaffFilters } from "@/types/staff";

const API_BASE = "/api/staff";

// Fetch staff with filters
export const useStaff = (filters?: StaffFilters) => {
  const queryString = new URLSearchParams();
  
  if (filters?.search) queryString.append("search", filters.search);
  if (filters?.role) queryString.append("role", filters.role);
  if (filters?.isActive !== undefined) queryString.append("isActive", filters.isActive.toString());
  if (filters?.dateFrom) queryString.append("dateFrom", filters.dateFrom);
  if (filters?.dateTo) queryString.append("dateTo", filters.dateTo);

  const url = `${API_BASE}?${queryString.toString()}`;

  return useQuery({
    queryKey: ["staff", filters],
    queryFn: async (): Promise<{ staff: Staff[]; pagination: any }> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch staff");
      }
      return response.json();
    },
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Fetch single staff member
export const useStaffMember = (id: string) => {
  return useQuery({
    queryKey: ["staff", id],
    queryFn: async (): Promise<Staff> => {
      const response = await fetch(`${API_BASE}/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch staff member");
      }
      return response.json();
    },
    enabled: !!id,
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

// Create new staff member
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: CreateStaffData): Promise<Staff> => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create staff member");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch staff list
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
  });
};

// Update staff member
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffData: UpdateStaffData): Promise<Staff> => {
      const response = await fetch(`${API_BASE}/${staffData.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(staffData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update staff member");
      }

      return response.json();

    },
    onSuccess: (updatedStaff: Staff) => {
      // Invalidate and refetch staff list
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      // Update specific staff member in cache
      queryClient.setQueryData(["staff", updatedStaff.id], updatedStaff);
    },
  });
};

// Delete staff member
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (staffId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${staffId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete staff member");
      }
    },
    onSuccess: (_: void, staffId: string) => {
      // Invalidate and refetch staff list
      queryClient.invalidateQueries({ queryKey: ["staff"] });
      // Remove specific staff member from cache
      queryClient.removeQueries({ queryKey: ["staff", staffId] });
    },
  });
};
