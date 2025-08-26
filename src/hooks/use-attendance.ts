import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StaffAttendance, CreateAttendanceData, UpdateAttendanceData } from '@/types/staff';

interface AttendanceFilters {
  staffId?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  page?: number;
  limit?: number;
}

interface AttendanceResponse {
  attendance: StaffAttendance[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Fetch attendance records
export const useAttendance = (filters: AttendanceFilters = {}) => {
  const queryString = new URLSearchParams();
  
  if (filters.staffId) queryString.append('staffId', filters.staffId);
  if (filters.date) queryString.append('date', filters.date);
  if (filters.dateFrom) queryString.append('dateFrom', filters.dateFrom);
  if (filters.dateTo) queryString.append('dateTo', filters.dateTo);
  if (filters.status) queryString.append('status', filters.status);
  if (filters.page) queryString.append('page', filters.page.toString());
  if (filters.limit) queryString.append('limit', filters.limit.toString());

  return useQuery<AttendanceResponse>({
    queryKey: ['attendance', filters],
    queryFn: async () => {
      const response = await fetch(`/api/attendance?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance records');
      }
      return response.json();
    },
  });
};

// Fetch single attendance record
export const useAttendanceRecord = (id: string) => {
  return useQuery<StaffAttendance>({
    queryKey: ['attendance', id],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch attendance record');
      }
      return response.json();
    },
    enabled: !!id,
  });
};

// Create attendance record
export const useCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAttendanceData) => {
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create attendance record');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Update attendance record
export const useUpdateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAttendanceData }) => {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update attendance record');
      }
      
      return response.json();
    },
    onSuccess: (_, { id }) => {
      // Invalidate and refetch attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['attendance', id] });
    },
  });
};

// Delete attendance record
export const useDeleteAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/attendance/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete attendance record');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

// Bulk create attendance records for multiple staff members
export const useBulkCreateAttendance = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateAttendanceData[]) => {
      const promises = data.map(record => 
        fetch('/api/attendance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        })
      );
      
      const responses = await Promise.all(promises);
      
      // Check if any request failed
      for (const response of responses) {
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to create attendance records');
        }
      }
      
      return Promise.all(responses.map(r => r.json()));
    },
    onSuccess: () => {
      // Invalidate and refetch attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};
