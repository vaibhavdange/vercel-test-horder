'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Users, MapPin, Settings, X, Calendar } from 'lucide-react';
import { Table, TableStatus, CreateTableRequest } from '@/types/tables';
import PaymentDrawer from '@/components/ui/PaymentDrawer';
import { Order } from '@/types/orders';
import { useTables } from '@/hooks/useTables';
import { TableCard } from '@/components/tables/TableCard';
import { parseSupabaseTimestamp } from '@/lib/time';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function TablesPage() {
  // Add Material Symbols font and styles
  React.useEffect(() => {
    // Add font link if not already present
    if (!document.querySelector('link[href*="Material+Symbols+Outlined"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=stairs_2';
      document.head.appendChild(link);
    }

    // Add CSS styles if not already present
    if (!document.querySelector('style[data-material-symbols]')) {
      const style = document.createElement('style');
      style.setAttribute('data-material-symbols', 'true');
      style.textContent = `
        .material-symbols-outlined {
          font-variation-settings:
          'FILL' 0,
          'wght' 400,
          'GRAD' 0,
          'opsz' 24
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const [statusFilter, setStatusFilter] = useState<TableStatus | 'all'>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('all');
  const [showAddTable, setShowAddTable] = useState(false);
  const [showAddFloor, setShowAddFloor] = useState(false);
  const [showAddArea, setShowAddArea] = useState(false);
  const [showManagementModal, setShowManagementModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [tableOrder, setTableOrder] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

  // Load table order and filters from localStorage on component mount
  useEffect(() => {
    const savedOrder = localStorage.getItem('tableOrder');
    if (savedOrder) {
      try {
        setTableOrder(JSON.parse(savedOrder));
      } catch (error) {
        console.error('Failed to parse saved table order:', error);
      }
    }
    const savedStatus = localStorage.getItem('tables.statusFilter');
    const savedFloor = localStorage.getItem('tables.floorFilter');
    const savedArea = localStorage.getItem('tables.areaFilter');
    if (savedStatus) setStatusFilter(savedStatus as TableStatus | 'all');
    if (savedFloor) setFloorFilter(savedFloor);
    if (savedArea) setAreaFilter(savedArea);
  }, []);

  const {
    floors,
    areas,
    tables,
    floorsLoading,
    areasLoading,
    tablesLoading,
    floorsError,
    areasError,
    tablesError,
    createTableMutation,
    updateTableMutation,
    deleteTableMutation,
    updateTableStatusMutation,
    createFloorMutation,
    createAreaMutation,
    updateFloorMutation,
    updateAreaMutation,
    updateTableOrderMutation,
  } = useTables();

  // Initialize table order when tables are loaded
  useEffect(() => {
    if (tables.length > 0) {
      const savedOrder = localStorage.getItem('tableOrder');
      let finalOrder: string[];
      
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          // Filter out any saved IDs that no longer exist in tables
          const validOrder = parsedOrder.filter((id: string) => 
            tables.some(table => table.id === id)
          );
          
          // Add any new tables that aren't in the saved order
          const newTables = tables.filter(table => 
            !validOrder.includes(table.id)
          );
          
          if (validOrder.length > 0 && newTables.length === 0) {
            // Use saved order if all tables are present
            finalOrder = validOrder;
          } else {
            // Use database order and merge with saved order
            const sortedTables = [...tables].sort((a, b) => a.displayOrder - b.displayOrder);
            finalOrder = sortedTables.map(table => table.id);
          }
        } catch (error) {
          console.error('Failed to parse saved table order:', error);
          const sortedTables = [...tables].sort((a, b) => a.displayOrder - b.displayOrder);
          finalOrder = sortedTables.map(table => table.id);
        }
      } else {
        // No saved order, use database order
        const sortedTables = [...tables].sort((a, b) => a.displayOrder - b.displayOrder);
        finalOrder = sortedTables.map(table => table.id);
      }
      
      setTableOrder(finalOrder);
      // Update localStorage with the final order
      localStorage.setItem('tableOrder', JSON.stringify(finalOrder));
    }
  }, [tables]);

  // Sync table order when tables change (e.g., after create/delete operations)
  useEffect(() => {
    if (tables.length > 0 && tableOrder.length > 0) {
      // Check if there are any tables in the database that aren't in our order
      const missingTables = tables.filter(table => !tableOrder.includes(table.id));
      
      if (missingTables.length > 0) {
        // Add missing tables to the end of the order
        const updatedOrder = [...tableOrder, ...missingTables.map(table => table.id)];
        setTableOrder(updatedOrder);
        localStorage.setItem('tableOrder', JSON.stringify(updatedOrder));
      }
      
      // Remove any order entries that no longer exist in tables
      const validOrder = tableOrder.filter(id => tables.some(table => table.id === id));
      if (validOrder.length !== tableOrder.length) {
        setTableOrder(validOrder);
        localStorage.setItem('tableOrder', JSON.stringify(validOrder));
      }
    }
  }, [tables, tableOrder]);

  // Save order when page is hidden or refreshed
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && tableOrder.length > 0) {
        localStorage.setItem('tableOrder', JSON.stringify(tableOrder));
      }
    };

    const handleBeforeUnload = () => {
      if (tableOrder.length > 0) {
        localStorage.setItem('tableOrder', JSON.stringify(tableOrder));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Save order when component unmounts
      if (tableOrder.length > 0) {
        localStorage.setItem('tableOrder', JSON.stringify(tableOrder));
      }
    };
  }, [tableOrder]);

  // Watch for successful table order updates
  useEffect(() => {
    if (updateTableOrderMutation.isSuccess && tableOrder.length > 0) {
      // Ensure localStorage is in sync with the current order
      localStorage.setItem('tableOrder', JSON.stringify(tableOrder));
    }
  }, [updateTableOrderMutation.isSuccess, tableOrder]);

  // Persist filters
  useEffect(() => {
    localStorage.setItem('tables.statusFilter', statusFilter);
  }, [statusFilter]);
  useEffect(() => {
    localStorage.setItem('tables.floorFilter', floorFilter);
  }, [floorFilter]);
  useEffect(() => {
    localStorage.setItem('tables.areaFilter', areaFilter);
  }, [areaFilter]);
  

  // Derived: areas limited by selected floor
  const visibleAreas = floorFilter === 'all' ? areas : areas.filter(a => a.floorId === floorFilter);

  // Filter tables based on search and filters
  const filteredTables = tables.filter(table => {
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    const matchesFloor = floorFilter === 'all' || table.floorId === floorFilter;
    const matchesArea = areaFilter === 'all' || table.areaId === areaFilter;

    return matchesStatus && matchesFloor && matchesArea;
  });

  // Sort filtered tables by the current tableOrder
  const sortedFilteredTables = filteredTables.sort((a, b) => {
    const aIndex = tableOrder.indexOf(a.id);
    const bIndex = tableOrder.indexOf(b.id);
    // If both are in tableOrder, sort by their position
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    // If only one is in tableOrder, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // If neither is in tableOrder, sort by table number
    return a.tableNumber.localeCompare(b.tableNumber);
  });

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTableOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        
        if (oldIndex === -1 || newIndex === -1) {
          console.error('Table not found in order:', { active: active.id, over: over.id, items });
          return items;
        }
        
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save the new order to localStorage
        localStorage.setItem('tableOrder', JSON.stringify(newOrder));
        
        // Set saving state
        setIsSavingOrder(true);
        
        // Save the new order to the backend
        const tableOrders = newOrder.map((tableId, index) => ({
          id: tableId,
          displayOrder: index,
        }));
        
        // Update backend with new order
        updateTableOrderMutation.mutate(
          { tableOrders },
          {
            onSuccess: () => {
              console.log('Table order updated successfully in backend');
              setIsSavingOrder(false);
            },
            onError: (error) => {
              console.error('Failed to update table order in backend:', error);
              setIsSavingOrder(false);
              // Optionally revert the order if backend update fails
              // setTableOrder(items);
            }
          }
        );
        
        return newOrder;
      });
    }
  };

  // Event handlers
  const handleTableClick = (table: Table) => {
    // If table is occupied and has a current order, navigate to new order with context
    const current = table.orders?.[0];
    if (table.status === 'occupied' && current) {
      // Open table details instead of redirecting
      setSelectedTable(table);
      setShowTableDetails(true);
      return;
    }
    setSelectedTable(table);
    setShowTableDetails(true);
  };

  const handleStatusChange = (tableId: string, status: TableStatus) => {
    updateTableStatusMutation.mutate({ tableId, status });
  };

  const handleEditTable = (table: Table) => {
    setSelectedTable(table);
    setShowAddTable(true);
  };

  const handleDeleteTable = (tableId: string) => {
    if (confirm('Are you sure you want to delete this table? This action cannot be undone.')) {
      deleteTableMutation.mutate(tableId);
      
      // Remove from order when deleted
      setTableOrder(prev => {
        const newOrder = prev.filter(id => id !== tableId);
        
        // Update localStorage
        localStorage.setItem('tableOrder', JSON.stringify(newOrder));
        
        // Update backend with new order for remaining tables
        if (newOrder.length > 0) {
          const tableOrders = newOrder.map((id, index) => ({
            id,
            displayOrder: index,
          }));
          updateTableOrderMutation.mutate({ tableOrders });
        }
        
        return newOrder;
      });
    }
  };

  const handleCreateTable = (data: CreateTableRequest) => {
    // Assign the next displayOrder value
    const newDisplayOrder = tables.length > 0 ? Math.max(...tables.map(t => t.displayOrder)) + 1 : 0;
    const tableDataWithOrder = { ...data, displayOrder: newDisplayOrder };
    
    createTableMutation.mutate(tableDataWithOrder);
    
    // Add new table to the order
    setTableOrder(prev => {
      const newOrder = [...prev, `temp-${Date.now()}`]; // Temporary ID until table is created
      localStorage.setItem('tableOrder', JSON.stringify(newOrder));
      return newOrder;
    });
    
    setShowAddTable(false);
  };

  const handleUpdateTable = (tableId: string, data: Partial<CreateTableRequest>) => {
    updateTableMutation.mutate({ id: tableId, data });
    setShowAddTable(false);
    setSelectedTable(null);
  };

  const handleCreateFloor = (data: { name: string; description?: string }) => {
    createFloorMutation.mutate(data);
    setShowAddFloor(false);
  };

  const handleCreateArea = (data: { name: string; description?: string; floorId: string }) => {
    createAreaMutation.mutate(data);
    setShowAddArea(false);
  };

  if (floorsLoading || areasLoading || tablesLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tables...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="max-w-[1440px] mx-auto p-6">


        {/* Error Banner */}
        {(floorsError || areasError || tablesError) && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="font-medium mb-1">There was a problem loading data</div>
            <div className="text-sm">
              {floorsError && <div>Floors: {(floorsError as any).message || 'Failed to load floors'}</div>}
              {areasError && <div>Areas: {(areasError as any).message || 'Failed to load areas'}</div>}
              {tablesError && <div>Tables: {(tablesError as any).message || 'Failed to load tables'}</div>}
            </div>
          </div>
        )}

        {/* Unified Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 mb-6">
                      {/* Top row: Floors segmented + quick stats + actions */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
                {/* Floors segmented control */}
                <div className="flex-1 min-w-0 overflow-x-auto">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setFloorFilter('all'); setAreaFilter('all'); }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${floorFilter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                      All Floors
                    </button>
                    {floors.map((floor) => (
                      <button
                        key={floor.id}
                        onClick={() => { setFloorFilter(floor.id); setAreaFilter('all'); }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${floorFilter === floor.id ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {floor.name}
                      </button>
                    ))}
                  </div>
                </div>

              {/* Quick legend */}
              <div className="hidden lg:flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-emerald-500"/>Available {tables.filter(t => t.status === 'available').length}</div>
                <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-sky-500"/>Occupied {tables.filter(t => t.status === 'occupied').length}</div>
                <div className="flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-amber-500"/>Reserved {tables.filter(t => t.status === 'reserved').length}</div>
              </div>

              {/* Actions removed */}
            </div>

            {/* Status chips */}
            <div className="flex flex-wrap gap-2 lg:items-center">
                {([
                  { key: 'all', label: 'All' },
                  { key: 'available', label: 'Available' },
                  { key: 'occupied', label: 'Occupied' },
                  { key: 'reserved', label: 'Reserved' },
                  { key: 'cleaning', label: 'Cleaning' },
                  { key: 'unavailable', label: 'Unavailable' },
                ] as const).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setStatusFilter(key as any)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${statusFilter === key ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {label}
                  </button>
                ))}
            </div>

            {/* Bottom row: Areas for selected floor */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAreaFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${areaFilter === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                  All Areas
                </button>
                {visibleAreas.map((area) => (
                  <button
                    key={area.id}
                    onClick={() => setAreaFilter(area.id)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${areaFilter === area.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                  >
                    {area.name}
                  </button>
                ))}
              </div>
              {/* Reset filters button removed */}
            </div>
            
            {/* Comprehensive Edit Button - positioned at bottom right of container */}
            <div className="relative">
              <div className="absolute -bottom-2 -right-2 flex gap-2">
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`px-4 py-2 rounded-full transition-colors text-sm font-medium border ${
                    isEditMode 
                      ? 'bg-gray-900 text-white border-gray-900' 
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-900 hover:text-white hover:border-gray-900'
                  }`}
                  title="Drag tables to rearrange layout"
                >
                  Rearrange Table Layout
                </button>
                <button
                  onClick={() => setShowManagementModal(true)}
                  className="bg-white text-gray-700 px-4 py-2 rounded-full hover:bg-gray-900 hover:text-white transition-colors text-sm font-medium border border-gray-200 hover:border-gray-900"
                  title="Manage Floors, Areas & Tables"
                >
                  Manage
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Old summary indicators removed as requested */}

        {/* Tables Grid with Drag and Drop */}
        <div className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-medium text-gray-900">Tables</h3>
              
              {/* Saving Indicator */}
              {isSavingOrder && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Saving order...</span>
                </div>
              )}
              

              
              {/* Reset order button removed */}
            </div>

            {/* Dropdown filters removed to avoid redundancy */}
          </div>
          
          {isEditMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedFilteredTables.map(table => table.id)}
                strategy={rectSortingStrategy}
              >
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-[180px] items-stretch"
                  onClick={() => setIsEditMode(false)} // Click anywhere to exit edit mode
                >
                  {sortedFilteredTables.map((table) => (
                    <SortableTableCard
                      key={table.id}
                      table={table}
                      onTableClick={handleTableClick}
                      onStatusChange={handleStatusChange}
                      onEdit={handleEditTable}
                      onDelete={handleDeleteTable}
                      isEditMode={true}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 auto-rows-[180px] items-stretch">
              {sortedFilteredTables.map((table) => (
                <TableCard
                  key={table.id}
                  table={table}
                  onTableClick={handleTableClick}
                  onStatusChange={handleStatusChange}
                  onEdit={handleEditTable}
                  onDelete={handleDeleteTable}
                  showActions={true}
                  onOpenPayment={(order) => {
                    setSelectedOrderForPayment(order);
                    setIsPaymentOpen(true);
                  }}
                  onAmendOrder={(order) => {
                    try {
                      const orderData = {
                        isAmending: true,
                        existingOrderId: order.id,
                        orderType: order.orderType || 'dine-in',
                        tableNumber: order.tableNumber,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        customerId: order.customerId,
                        existingItems: (order.orderItems || []).map((item: any) => ({
                          id: item.productId,
                          name: item.productName,
                          price: item.unitPrice,
                          quantity: item.quantity,
                          total: item.totalPrice,
                          customizationNotes: item.customizationNotes
                        }))
                      };
                      localStorage.setItem('amendOrderData', JSON.stringify(orderData));
                      window.location.href = '/dashboard/new-order';
                    } catch (e) {
                      console.error('Failed to start amend flow:', e);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
            <p className="text-gray-600 mb-4">
              {statusFilter !== 'all' || areaFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first table'}
            </p>
            {/* Add Table button removed; manage tables via Settings */}
          </div>
        )}

        {/* Add Floor Modal */}
        {showAddFloor && (
          <FloorModal
            onClose={() => setShowAddFloor(false)}
            onSubmit={handleCreateFloor}
          />
        )}

        {/* Add Area Modal */}
        {showAddArea && (
          <AreaModal
            floors={floors}
            onClose={() => setShowAddArea(false)}
            onSubmit={handleCreateArea}
          />
        )}

        {/* Add/Edit Table Modal */}
        {showAddTable && (
          <TableModal
            floors={floors}
            areas={areas}
            table={selectedTable}
            onClose={() => {
              setShowAddTable(false);
              setSelectedTable(null);
            }}
            onSubmit={selectedTable ? 
              (data) => handleUpdateTable(selectedTable.id, data) : 
              handleCreateTable
            }
            onDelete={selectedTable ? handleDeleteTable : undefined}
          />
        )}

        {/* Management Modal for Floors, Areas & Tables */}
        {showManagementModal && (
          <ManagementModal
            floors={floors}
            areas={areas}
            tables={tables}
            onClose={() => setShowManagementModal(false)}
            onCreateFloor={(data) => {
              createFloorMutation.mutate(data, { onSuccess: () => setShowManagementModal(false) });
            }}
            onCreateArea={(data) => {
              createAreaMutation.mutate(data, { onSuccess: () => setShowManagementModal(false) });
            }}
            onCreateTable={(data) => {
              createTableMutation.mutate(data, { onSuccess: () => setShowManagementModal(false) });
            }}
            onUpdateFloor={(id, data) => {
              updateFloorMutation.mutate({ id, data }, { onSuccess: () => setShowManagementModal(false) });
            }}
            onUpdateArea={(id, data) => {
              updateAreaMutation.mutate({ id, data }, { onSuccess: () => setShowManagementModal(false) });
            }}
            onUpdateTable={(id, data) => {
              updateTableMutation.mutate({ id, ...data }, { onSuccess: () => setShowManagementModal(false) });
            }}
            onDeleteFloor={(id) => {
              // TODO: Implement floor delete mutation
              console.log('Delete floor:', id);
            }}
            onDeleteArea={(id) => {
              // TODO: Implement area delete mutation
              console.log('Delete area:', id);
            }}
            onDeleteTable={(id) => {
              deleteTableMutation.mutate(id, { onSuccess: () => setShowManagementModal(false) });
            }}
          />
        )}

        {/* Table Details Drawer */}
        {showTableDetails && selectedTable && (
          <TableDetailsDrawer
            table={selectedTable}
            onClose={() => {
              setShowTableDetails(false);
              setSelectedTable(null);
            }}
            onEdit={() => {
              setShowTableDetails(false);
              setShowAddTable(true);
            }}
            onStatusChange={(tableId, status) => {
              handleStatusChange(tableId, status);
            }}
            onOpenPayment={(order) => { setSelectedOrderForPayment(order); setIsPaymentOpen(true); }}
            onAmendOrder={(order) => {
              try {
                const orderData = {
                  isAmending: true,
                  existingOrderId: order.id,
                  orderType: order.orderType || 'dine-in',
                  tableId: order.tableId,
                  tableNumber: order.tableNumber,
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  customerId: order.customerId,
                  existingItems: (order.orderItems || []).map((item: any) => ({
                    id: item.productId,
                    name: item.productName,
                    price: item.unitPrice,
                    quantity: item.quantity,
                    total: item.totalPrice,
                    customizationNotes: item.customizationNotes
                  }))
                };
                localStorage.setItem('amendOrderData', JSON.stringify(orderData));
                window.location.href = '/dashboard/new-order';
              } catch (e) {
                console.error('Failed to start amend flow:', e);
              }
            }}
          />
        )}

        {/* Analytics Drawer removed as requested */}

        {/* Payment Drawer for table order */}
        {selectedOrderForPayment && (
          <PaymentDrawer
            isOpen={isPaymentOpen}
            onClose={() => { setIsPaymentOpen(false); setSelectedOrderForPayment(null); }}
            order={selectedOrderForPayment as any}
            onPaymentComplete={async (transaction, paymentDetails) => {
              console.log('Print disabled: bill printing is temporarily removed.');
              setIsPaymentOpen(false);
              setSelectedOrderForPayment(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Sortable Table Card Component
function SortableTableCard({ 
  table, 
  onTableClick, 
  onStatusChange, 
  onEdit, 
  onDelete,
  isEditMode
}: { 
  table: Table; 
  onTableClick: (table: Table) => void; 
  onStatusChange: (tableId: string, status: TableStatus) => void; 
  onEdit?: (table: Table) => void; 
  onDelete?: (tableId: string) => void; 
  isEditMode: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };



  const [hasDragged, setHasDragged] = useState(false);

  const handleDragStart = () => {
    setHasDragged(true);
  };

  const handleDragEnd = () => {
    // Reset drag state after a short delay
    setTimeout(() => setHasDragged(false), 100);
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if we haven't dragged
    if (!hasDragged) {
      onTableClick(table);
    }
    // Reset drag state
    setHasDragged(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none"
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
              <TableCard
          table={table}
          onTableClick={onTableClick} // Pass through the click handler
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={true}
          isEditMode={isEditMode}
        />
    </div>
  );
}

// Floor Modal Component
function FloorModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void; 
  onSubmit: (data: { name: string; description?: string }) => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Floor</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Ground Floor, First Floor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main dining area with outdoor seating"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-emerald-200 text-emerald-800 py-2 rounded-lg hover:bg-emerald-300 transition-colors border border-emerald-300"
            >
              Create Floor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Area Modal Component
function AreaModal({ 
  floors, 
  onClose, 
  onSubmit 
}: { 
  floors: any[]; 
  onClose: () => void; 
  onSubmit: (data: { name: string; description?: string; floorId: string }) => void; 
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    floorId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim() && formData.floorId) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Add New Area</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={formData.floorId}
              onChange={(e) => setFormData({ ...formData, floorId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a floor</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Main Dining, Bar Area, Outdoor"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Spacious dining area with natural lighting"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors border border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-violet-200 text-violet-800 py-2 rounded-lg hover:bg-violet-300 transition-colors border border-violet-300"
            >
              Create Area
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Table Modal Component
function TableModal({ 
  floors, 
  areas, 
  table, 
  onClose, 
  onSubmit,
  onDelete
}: { 
  floors: any[]; 
  areas: any[]; 
  table?: Table | null; 
  onClose: () => void; 
  onSubmit: (data: CreateTableRequest) => void; 
  onDelete?: (tableId: string) => void;
}) {
  const [formData, setFormData] = useState({
    tableNumber: table?.tableNumber || '',
    capacity: table?.capacity || 4,
    areaId: table?.areaId || '',
    floorId: table?.floorId || '',
    status: table?.status || 'available'
  });
  const [selectedFloor, setSelectedFloor] = useState<string>(table?.floorId || '');

  const selectedFloorData = floors.find(f => f.id === selectedFloor);
  const availableAreas = areas.filter(area => area.floorId === selectedFloor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.tableNumber && formData.areaId && formData.floorId) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {table ? 'Edit Table' : 'Add New Table'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Floor</label>
            <select
              value={selectedFloor}
              onChange={(e) => {
                setSelectedFloor(e.target.value);
                setFormData({ ...formData, floorId: e.target.value, areaId: '' });
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a floor</option>
              {floors.map((floor) => (
                <option key={floor.id} value={floor.id}>
                  {floor.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
            <select
              value={formData.areaId}
              onChange={(e) => setFormData({ ...formData, areaId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!selectedFloor}
            >
              <option value="">Select an area</option>
              {availableAreas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Table Number</label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., 1, 2, VIP-1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="20"
              required
            />
          </div>

          {table && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status || table.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as TableStatus })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
                <option value="cleaning">Cleaning</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-200"
            >
              Cancel
            </button>
            <div className="ml-auto flex items-center gap-2">
              {table && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this table? This cannot be undone.')) {
                      onDelete?.(table.id);
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-md border border-red-200 hover:bg-red-100"
                >
                  Delete
                </button>
              )}
              <button
                type="submit"
                className="px-3 py-1.5 text-sm bg-sky-600 text-white rounded-md hover:bg-sky-700"
              >
                {table ? 'Save Changes' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Table Details Modal Component
function TableDetailsModal({ 
  table, 
  onClose, 
  onEdit,
  onStatusChange,
}: { 
  table: Table; 
  onClose: () => void; 
  onEdit: () => void; 
  onStatusChange: (tableId: string, status: TableStatus) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Table {table.tableNumber}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Quick Status Update */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onStatusChange(table.id, 'occupied');
                  onClose();
                }}
                className="bg-sky-200 text-sky-800 py-2 px-3 rounded-lg text-sm hover:bg-sky-300 transition-colors border border-sky-300"
              >
                Mark Occupied
              </button>
              <button
                onClick={() => {
                  onStatusChange(table.id, 'reserved');
                  onClose();
                }}
                className="bg-yellow-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-yellow-700 transition-colors"
              >
                Mark Reserved
              </button>
              <button
                onClick={() => {
                  onStatusChange(table.id, 'cleaning');
                  onClose();
                }}
                className="bg-violet-200 text-violet-800 py-2 px-3 rounded-lg text-sm hover:bg-violet-300 transition-colors border border-violet-300"
              >
                Mark Cleaning
              </button>
              <button
                onClick={() => {
                  onStatusChange(table.id, 'unavailable');
                  onClose();
                }}
                className="bg-red-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Mark Unavailable
              </button>
            </div>
          </div>

          {/* Order Management */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-700 mb-3">Order Management</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Navigate to new order page with table pre-selected
                  window.location.href = `/dashboard/new-order?table=${table.id}`;
                }}
                className="w-full bg-emerald-200 text-emerald-800 py-2 px-3 rounded-lg text-sm hover:bg-emerald-300 transition-colors flex items-center justify-center gap-2 border border-emerald-300"
              >
                <Plus className="w-4 h-4" />
                Create New Order
              </button>
              <button
                onClick={() => {
                  // View existing orders for this table
                  onClose();
                }}
                className="w-full bg-emerald-200 text-emerald-800 py-2 px-3 rounded-lg text-sm hover:bg-emerald-300 transition-colors border border-emerald-300"
              >
                View Table Orders
              </button>
            </div>
          </div>

          {/* Reservation Management */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-700 mb-3">Reservations</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Create new reservation
                  onClose();
                }}
                className="w-full bg-sky-200 text-sky-800 py-2 px-3 rounded-lg text-sm hover:bg-sky-300 transition-colors flex items-center justify-center gap-2 border border-sky-300"
              >
                <Calendar className="w-4 h-4" />
                New Reservation
              </button>
              <button
                onClick={() => {
                  // View existing reservations
                  onClose();
                }}
                className="w-full bg-sky-200 text-sky-800 py-2 px-3 rounded-lg text-sm hover:bg-sky-300 transition-colors border border-sky-300"
              >
                View Reservations
              </button>
            </div>
          </div>

          {/* Table Information (Compact) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Table Info</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <span>{table.capacity} seats</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{table.area?.name} • {table.floor?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Status: </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(table.status)}`}>
                  {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                </span>
              </div>
              {table.status === 'occupied' && table.orders?.[0] && (
                <div className="flex items-center justify-between">
                  <div className="text-xs text-blue-700">
                    Order #{table.orders[0].orderNumber || table.orders[0].id.slice(-6)}
                  </div>
                  <div className="text-xs text-blue-600">
                    Since {parseSupabaseTimestamp(table.orders[0].createdAt as any).toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onEdit}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Edit Table
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function for status colors (duplicated from main component)
function getStatusColor(status: TableStatus) {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'occupied':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'reserved':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cleaning':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'unavailable':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

// Slide-over Table Details Drawer
function TableDetailsDrawer({ 
  table, 
  onClose, 
  onEdit,
  onStatusChange,
  onOpenPayment,
  onAmendOrder,
}: { 
  table: Table; 
  onClose: () => void; 
  onEdit: () => void; 
  onStatusChange: (tableId: string, status: TableStatus) => void;
  onOpenPayment: (order: any) => void;
  onAmendOrder: (order: any) => void;
}) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full sm:w-[420px] bg-white shadow-xl border-l border-gray-200 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex items-start justify-between">
          <div>
            <div className="text-xs text-gray-500">Table</div>
            <div className="text-xl font-semibold text-gray-900">{table.tableNumber}</div>
            <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border mt-2 ${getStatusColor(table.status)}`}>
              <span>{table.status.charAt(0).toUpperCase() + table.status.slice(1)}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Info */}
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-500" /><span>{table.capacity} seats</span></div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-500" /><span>{table.area?.name} • {table.floor?.name}</span></div>
            {table.status === 'occupied' && table.orders?.[0] && (
              <div className="flex items-center justify-between text-xs text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded">
                <div>Order #{table.orders[0].orderNumber || table.orders[0].id.slice(-6)}</div>
                <div>Since {parseSupabaseTimestamp(table.orders[0].createdAt as any).toLocaleTimeString()}</div>
              </div>
            )}
          </div>

          {/* Quick status actions */}
          <div>
            <div className="text-xs font-medium text-gray-500 mb-2">Quick Status</div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => onStatusChange(table.id, 'available')} className="px-3 py-2 rounded-lg text-sm border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100">Mark Available</button>
              <button onClick={() => onStatusChange(table.id, 'occupied')} className="px-3 py-2 rounded-lg text-sm border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100">Mark Occupied</button>
              <button onClick={() => onStatusChange(table.id, 'reserved')} className="px-3 py-2 rounded-lg text-sm border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100">Mark Reserved</button>
              <button onClick={() => onStatusChange(table.id, 'cleaning')} className="px-3 py-2 rounded-lg text-sm border border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100">Mark Cleaning</button>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="space-y-2">
            {table.status === 'available' && (
              <button
                onClick={() => { window.location.href = `/dashboard/new-order?table=${table.id}`; }}
                className="w-full bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700"
              >
                Seat Now
              </button>
            )}
            {table.status === 'occupied' && table.orders?.[0] && (
              <div className="flex gap-2">
                <button
                  onClick={() => onOpenPayment(table.orders![0])}
                  disabled={table.orders[0].paymentStatus === 'paid'}
                  className={`flex-1 rounded-lg px-4 py-2.5 ${
                    table.orders[0].paymentStatus === 'paid'
                      ? 'bg-green-600 text-white cursor-not-allowed'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                  }`}
                >
                  {table.orders[0].paymentStatus === 'paid' ? 'Bill Paid ✓' : 'Pay Bill'}
                </button>
                {table.orders[0].status !== 'completed' && (
                  <button
                    onClick={() => onAmendOrder(table.orders![0])}
                    className="flex-1 bg-gray-100 text-gray-800 px-4 py-2.5 rounded-lg hover:bg-gray-200 border border-gray-300"
                  >
                    Amend Order
                  </button>
                )}
              </div>
            )}
            <button onClick={onEdit} className="w-full bg-gray-100 text-gray-800 px-4 py-2.5 rounded-lg hover:bg-gray-200 border border-gray-300">Edit Table</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Analytics drawer removed

// Management Modal Component
function ManagementModal({ 
  floors, 
  areas, 
  tables, 
  onClose, 
  onCreateFloor, 
  onCreateArea, 
  onCreateTable,
  onUpdateFloor,
  onUpdateArea,
  onUpdateTable,
  onDeleteFloor,
  onDeleteArea,
  onDeleteTable
}: { 
  floors: any[]; 
  areas: any[]; 
  tables: any[]; 
  onClose: () => void; 
  onCreateFloor: (data: { name: string; description?: string }) => void;
  onCreateArea: (data: { name: string; description?: string; floorId: string }) => void;
  onCreateTable: (data: any) => void;
  onUpdateFloor: (id: string, data: { name: string; description?: string }) => void;
  onUpdateArea: (id: string, data: { name: string; description?: string; floorId: string }) => void;
  onUpdateTable: (id: string, data: any) => void;
  onDeleteFloor: (id: string) => void;
  onDeleteArea: (id: string) => void;
  onDeleteTable: (id: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'floors' | 'areas' | 'tables'>('floors');
  const [editingItem, setEditingItem] = useState<{ type: 'floor' | 'area' | 'table'; id: string; data: any } | null>(null);
  const [newItem, setNewItem] = useState<{ type: 'floor' | 'area' | 'table'; data: any } | null>(null);

  const handleCreate = () => {
    if (newItem) {
      switch (newItem.type) {
        case 'floor':
          onCreateFloor(newItem.data);
          break;
        case 'area':
          onCreateArea(newItem.data);
          break;
        case 'table':
          onCreateTable(newItem.data);
          break;
      }
      setNewItem(null);
    }
  };

  const handleUpdate = () => {
    if (editingItem) {
      switch (editingItem.type) {
        case 'floor':
          onUpdateFloor(editingItem.id, editingItem.data);
          break;
        case 'area':
          onUpdateArea(editingItem.id, editingItem.data);
          break;
        case 'table':
          onUpdateTable(editingItem.id, editingItem.data);
          break;
      }
      setEditingItem(null);
    }
  };

  const handleDelete = (type: 'floor' | 'area' | 'table', id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      switch (type) {
        case 'floor':
          onDeleteFloor(id);
          break;
        case 'area':
          onDeleteArea(id);
          break;
        case 'table':
          onDeleteTable(id);
          break;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Manage Floors, Areas & Tables</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md">
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['floors', 'areas', 'tables'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Floors Tab */}
            {activeTab === 'floors' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Floors</h3>
                  <button
                    onClick={() => setNewItem({ type: 'floor', data: { name: '', description: '' } })}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700"
                  >
                    Add Floor
                  </button>
                </div>
                
                {newItem?.type === 'floor' && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">New Floor</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Floor name"
                        value={newItem.data.name}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, name: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newItem.data.description || ''}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, description: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreate}
                          disabled={!newItem.data.name}
                          className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 disabled:opacity-50"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setNewItem(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {floors.map((floor) => (
                    <div key={floor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{floor.name}</div>
                        {floor.description && <div className="text-sm text-gray-600">{floor.description}</div>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem({ type: 'floor', id: floor.id, data: { name: floor.name, description: floor.description } })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('floor', floor.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {editingItem?.type === 'floor' && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                    <div className="bg-white p-6 rounded-lg w-96">
                      <h4 className="font-medium mb-3">Edit Floor</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Floor name"
                          value={editingItem.data.name}
                          onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={editingItem.data.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={!editingItem.data.name}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {editingItem?.type === 'area' && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
                    <div className="bg-white p-6 rounded-lg w-96">
                      <h4 className="font-medium mb-3">Edit Area</h4>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Area name"
                          value={editingItem.data.name}
                          onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <select
                          value={editingItem.data.floorId}
                          onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, floorId: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        >
                          {floors.map((floor) => (
                            <option key={floor.id} value={floor.id}>{floor.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={editingItem.data.description || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleUpdate}
                            disabled={!editingItem.data.name || !editingItem.data.floorId}
                            className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Update
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Areas Tab */}
            {activeTab === 'areas' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Areas</h3>
                  <button
                    onClick={() => setNewItem({ type: 'area', data: { name: '', description: '', floorId: floors[0]?.id || '' } })}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700"
                  >
                    Add Area
                  </button>
                </div>
                
                {newItem?.type === 'area' && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">New Area</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Area name"
                        value={newItem.data.name}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, name: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <select
                        value={newItem.data.floorId}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, floorId: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {floors.map((floor) => (
                          <option key={floor.id} value={floor.id}>{floor.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={newItem.data.description || ''}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, description: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreate}
                          disabled={!newItem.data.name || !newItem.data.floorId}
                          className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 disabled:opacity-50"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setNewItem(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {areas.map((area) => (
                    <div key={area.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{area.name}</div>
                        <div className="text-sm text-gray-600">
                          {floors.find(f => f.id === area.floorId)?.name} • {area.description || 'No description'}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem({ type: 'area', id: area.id, data: { name: area.name, description: area.description, floorId: area.floorId } })}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('area', area.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tables Tab */}
            {activeTab === 'tables' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">Tables</h3>
                  <button
                    onClick={() => setNewItem({ type: 'table', data: { tableNumber: '', capacity: 4, floorId: floors[0]?.id || '', areaId: areas[0]?.id || '' } })}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-full hover:bg-emerald-700"
                  >
                    Add Table
                  </button>
                </div>
                
                {newItem?.type === 'table' && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-medium mb-3">New Table</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Table number"
                        value={newItem.data.tableNumber}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, tableNumber: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <input
                        type="number"
                        placeholder="Capacity"
                        value={newItem.data.capacity}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, capacity: parseInt(e.target.value) } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                      <select
                        value={newItem.data.floorId}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, floorId: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {floors.map((floor) => (
                          <option key={floor.id} value={floor.id}>{floor.name}</option>
                        ))}
                      </select>
                      <select
                        value={newItem.data.areaId}
                        onChange={(e) => setNewItem({ ...newItem, data: { ...newItem.data, areaId: e.target.value } })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        {areas.map((area) => (
                          <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreate}
                          disabled={!newItem.data.tableNumber || !newItem.data.floorId || !newItem.data.areaId}
                          className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 disabled:opacity-50"
                        >
                          Create
                        </button>
                        <button
                          onClick={() => setNewItem(null)}
                          className="bg-gray-300 text-gray-700 px-4 py-2 rounded-full hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {tables.map((table) => (
                    <div key={table.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">Table {table.tableNumber}</div>
                        <div className="text-sm text-gray-600">
                          {table.capacity} seats • {areas.find(a => a.id === table.areaId)?.name} • {floors.find(f => f.id === table.floorId)?.name}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem({ type: 'table', id: table.id, data: { tableNumber: table.tableNumber, capacity: table.capacity, floorId: table.floorId, areaId: table.areaId } })}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete('table', table.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}