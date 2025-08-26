import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Order, CreateOrderData, UpdateOrderData, OrderFilters } from "@/types/orders";

const API_BASE = "/api/orders";

// Fetch orders with filters
export const useOrders = (filters?: OrderFilters) => {
  const queryString = new URLSearchParams();
  
  if (filters?.status) queryString.append("status", filters.status);
  if (filters?.search) queryString.append("search", filters.search);
  if (filters?.customerId) queryString.append("customerId", filters.customerId);
  if (filters?.dateFrom) queryString.append("dateFrom", filters.dateFrom);
  if (filters?.dateTo) queryString.append("dateTo", filters.dateTo);

  const url = `${API_BASE}?${queryString.toString()}`;

  return useQuery({
    queryKey: ["orders", filters],
    queryFn: async (): Promise<Order[]> => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
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

// Create new order
export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData): Promise<Order> => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Also invalidate products to refresh stock quantities
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Also invalidate tables to reflect occupancy status immediately
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
  });
};

// Create new order with optimistic updates
export const useCreateOrderOptimistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderData: CreateOrderData): Promise<Order> => {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create order");
      }

      return response.json();
    },
    // Optimistically add the order to the cache
    onMutate: async (orderData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["orders"] });

      // Snapshot the previous value
      const previousOrders = queryClient.getQueryData<Order[]>(["orders"]);

      // Create optimistic order object
      const optimisticOrder: Order = {
        id: `temp-${Date.now()}`, // Temporary ID
        orderNumber: `TEMP-${Date.now()}`, // Temporary order number
        orderType: orderData.orderType,
        tableId: orderData.tableId,
        tableNumber: orderData.tableNumber,
        customerId: orderData.customerId,
        customerName: orderData.customerName,
        customerPhone: orderData.customerPhone,
        status: "pending",
        subStatus: orderData.subStatus || "Order Created",
        subtotal: orderData.subtotal,
        taxAmount: orderData.taxAmount || 0,
        serviceChargeAmount: orderData.serviceChargeAmount || 0,
        serviceChargeRate: orderData.serviceChargeRate || 0,
        discountAmount: orderData.discountAmount || 0,
        totalAmount: orderData.totalAmount,
        paymentStatus: orderData.paymentStatus || "pending",
        paymentMethod: orderData.paymentMethod,
        notes: orderData.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orderItems: orderData.orderItems.map(item => ({
          id: `temp-item-${Date.now()}-${Math.random()}`,
          orderId: `temp-${Date.now()}`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          customizationNotes: item.customizationNotes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      };

      // Optimistically update the cache
      queryClient.setQueryData<Order[]>(["orders"], (old) => {
        return old ? [optimisticOrder, ...old] : [optimisticOrder];
      });

      // Also update tables if it's a dine-in order
      if (orderData.tableId) {
        queryClient.setQueryData<any[]>(["tables"], (old) => {
          if (!old) return old;
          return old.map(table => 
            table.id === orderData.tableId 
              ? { ...table, status: "occupied", currentOrderId: optimisticOrder.id }
              : table
          );
        });
      }

      return { previousOrders, optimisticOrder };
    },
    onSuccess: (newOrder, variables, context) => {
      // Replace optimistic order with real order
      queryClient.setQueryData<Order[]>(["orders"], (old) => {
        if (!old) return [newOrder];
        return old.map(order => 
          order.id === context?.optimisticOrder.id ? newOrder : order
        );
      });

      // Update tables with real order ID
      if (variables.tableId) {
        queryClient.setQueryData<any[]>(["tables"], (old) => {
          if (!old) return old;
          return old.map(table => 
            table.id === variables.tableId 
              ? { ...table, currentOrderId: newOrder.id }
              : table
          );
        });
      }

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["tables"] });
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousOrders) {
        queryClient.setQueryData(["orders"], context.previousOrders);
      }

      // Rollback table status
      if (variables.tableId) {
        queryClient.setQueryData<any[]>(["tables"], (old) => {
          if (!old) return old;
          return old.map(table => 
            table.id === variables.tableId 
              ? { ...table, status: "available", currentOrderId: null }
              : table
          );
        });
      }
    },
  });
};

// Update order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, subStatus }: { orderId: string; status: "pending" | "in-process" | "ready" | "completed" | "cancelled" | "out-for-delivery" | "delivered"; subStatus?: string }): Promise<Order> => {
      const response = await fetch(`${API_BASE}/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, subStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order");
      }

      return response.json();
    },
    // Show instant feedback while the network request is in-flight
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      const previousData = queryClient.getQueriesData<Order[]>({ queryKey: ["orders"] });

      // Optimistically update every cached orders list
      previousData.forEach(([queryKey, data]) => {
        if (!data) return;
        queryClient.setQueryData<Order[]>(queryKey, data.map((o) => (
          o.id === variables.orderId
            ? { ...o, status: variables.status, subStatus: variables.subStatus ?? o.subStatus }
            : o
        )));
      });

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      context?.previousData?.forEach?.(([queryKey, data]: any) => {
        queryClient.setQueryData(queryKey, data);
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
};

// Update order content (items, totals, etc.)
export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, orderData }: { orderId: string; orderData: UpdateOrderData }): Promise<Order> => {
      const response = await fetch(`${API_BASE}/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update order");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Also invalidate products to refresh stock quantities
      queryClient.invalidateQueries({ queryKey: ["products"] });
      // Invalidate ingredients to refresh inventory
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
  });
};

// Delete order
export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string): Promise<void> => {
      const response = await fetch(`${API_BASE}/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete order");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
