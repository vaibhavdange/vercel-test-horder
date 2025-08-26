import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TablesService } from '@/lib/services/tablesService';
import { 
  Floor, 
  Area, 
  Table, 
  TableStatus, 
  CreateFloorRequest, 
  CreateAreaRequest, 
  CreateTableRequest, 
  UpdateTableRequest,
  TableOrderUpdateRequest
} from '@/types/tables';

export function useTables() {
  const queryClient = useQueryClient();

  // Floors
  const {
    data: floors = [],
    isLoading: floorsLoading,
    error: floorsError,
    refetch: refetchFloors
  } = useQuery({
    queryKey: ['floors'],
    queryFn: TablesService.getFloors,
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const createFloorMutation = useMutation({
    mutationFn: TablesService.createFloor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const updateFloorMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFloorRequest> }) =>
      TablesService.updateFloor(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const deleteFloorMutation = useMutation({
    mutationFn: TablesService.deleteFloor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  // Areas
  const {
    data: areas = [],
    isLoading: areasLoading,
    error: areasError,
    refetch: refetchAreas
  } = useQuery({
    queryKey: ['areas'],
    queryFn: TablesService.getAreas,
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const createAreaMutation = useMutation({
    mutationFn: TablesService.createArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const updateAreaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAreaRequest> }) =>
      TablesService.updateArea(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const deleteAreaMutation = useMutation({
    mutationFn: TablesService.deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  // Tables
  const {
    data: tables = [],
    isLoading: tablesLoading,
    error: tablesError,
    refetch: refetchTables
  } = useQuery({
    queryKey: ['tables'],
    queryFn: TablesService.getTables,
    staleTime: 8000,
    refetchInterval: 8000,
    refetchIntervalInBackground: true, // Continue polling even when tab is not active
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const createTableMutation = useMutation({
    mutationFn: TablesService.createTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTableRequest }) =>
      TablesService.updateTable(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const updateTableStatusMutation = useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: TableStatus }) =>
      TablesService.updateTableStatus(tableId, status),
    onMutate: async ({ tableId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['tables'] });
      const previousTables = queryClient.getQueryData<any[]>(['tables']);
      if (previousTables) {
        const optimistic = previousTables.map(t => t.id === tableId ? { ...t, status } : t);
        queryClient.setQueryData(['tables'], optimistic);
      }
      return { previousTables } as { previousTables?: any[] };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTables) {
        queryClient.setQueryData(['tables'], context.previousTables);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const updateTableOrderMutation = useMutation({
    mutationFn: (data: TableOrderUpdateRequest) =>
      TablesService.updateTableOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: TablesService.deleteTable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['floors'] });
    },
  });

  // Utility functions
  const getTablesByFloor = (floorId: string) => {
    return tables.filter(table => table.floorId === floorId);
  };

  const getTablesByArea = (areaId: string) => {
    return tables.filter(table => table.areaId === areaId);
  };

  const getAvailableTables = () => {
    return tables.filter(table => table.status === 'available');
  };

  const getOccupiedTables = () => {
    return tables.filter(table => table.status === 'occupied');
  };

  const getReservedTables = () => {
    return tables.filter(table => table.status === 'reserved');
  };

  const getCleaningTables = () => {
    return tables.filter(table => table.status === 'cleaning');
  };

  const getUnavailableTables = () => {
    return tables.filter(table => table.status === 'unavailable');
  };

  // Quick status updates
  const markTableAsOccupied = (tableId: string) => {
    return updateTableStatusMutation.mutate({ tableId, status: 'occupied' });
  };

  const markTableAsAvailable = (tableId: string) => {
    return updateTableStatusMutation.mutate({ tableId, status: 'available' });
  };

  const markTableAsReserved = (tableId: string) => {
    return updateTableStatusMutation.mutate({ tableId, status: 'reserved' });
  };

  const markTableAsCleaning = (tableId: string) => {
    return updateTableStatusMutation.mutate({ tableId, status: 'cleaning' });
  };

  const markTableAsUnavailable = (tableId: string) => {
    return updateTableStatusMutation.mutate({ tableId, status: 'unavailable' });
  };

  // Bulk operations
  const bulkUpdateTableStatus = (tableIds: string[], status: TableStatus) => {
    const promises = tableIds.map(id => 
      updateTableStatusMutation.mutate({ tableId: id, status })
    );
    return Promise.all(promises);
  };

  const bulkMarkTablesAsAvailable = (tableIds: string[]) => {
    return bulkUpdateTableStatus(tableIds, 'available');
  };

  const bulkMarkTablesAsCleaning = (tableIds: string[]) => {
    return bulkUpdateTableStatus(tableIds, 'cleaning');
  };

  return {
    // Data
    floors,
    areas,
    tables,
    
    // Loading states
    floorsLoading,
    areasLoading,
    tablesLoading,
    
    // Error states
    floorsError,
    areasError,
    tablesError,
    
    // Mutations
    createFloorMutation,
    updateFloorMutation,
    deleteFloorMutation,
    createAreaMutation,
    updateAreaMutation,
    deleteAreaMutation,
    createTableMutation,
    updateTableMutation,
    updateTableStatusMutation,
    updateTableOrderMutation,
    deleteTableMutation,

    
    // Utility functions
    getTablesByFloor,
    getTablesByArea,
    getAvailableTables,
    getOccupiedTables,
    getReservedTables,
    getCleaningTables,
    getUnavailableTables,
    
    // Quick actions
    markTableAsOccupied,
    markTableAsAvailable,
    markTableAsReserved,
    markTableAsCleaning,
    markTableAsUnavailable,
    
    // Bulk operations
    bulkUpdateTableStatus,
    bulkMarkTablesAsAvailable,
    bulkMarkTablesAsCleaning,
    
    // Refetch functions
    refetchFloors,
    refetchAreas,
    refetchTables,
  };
}
