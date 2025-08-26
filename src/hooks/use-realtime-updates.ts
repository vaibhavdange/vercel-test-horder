"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AppEvent } from "@/lib/services/event-bus";
import type { Order } from "@/types/orders";
import type { Table } from "@/types/tables";

// Comprehensive real-time updates hook for the entire application
export function useRealtimeUpdates() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    esRef.current = es;

    // Helper functions to update React Query cache
    const upsertOrderInCaches = (updater: (orderList: Order[]) => Order[]) => {
      const queries = queryClient.getQueriesData<Order[]>({ queryKey: ["orders"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<Order[]>(key, updater(data));
      });
    };

    const upsertTableInCaches = (updater: (tableList: Table[]) => Table[]) => {
      const queries = queryClient.getQueriesData<Table[]>({ queryKey: ["tables"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<Table[]>(key, updater(data));
      });
    };

    const upsertProductInCaches = (updater: (productList: any[]) => any[]) => {
      const queries = queryClient.getQueriesData<any[]>({ queryKey: ["products"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<any[]>(key, updater(data));
      });
    };

    const upsertCategoryInCaches = (updater: (categoryList: any[]) => any[]) => {
      const queries = queryClient.getQueriesData<any[]>({ queryKey: ["categories"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<any[]>(key, updater(data));
      });
    };

    const upsertStockItemInCaches = (updater: (stockItemList: any[]) => any[]) => {
      const queries = queryClient.getQueriesData<any[]>({ queryKey: ["stock-items"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<any[]>(key, updater(data));
      });
    };

    const upsertIngredientInCaches = (updater: (ingredientList: any[]) => any[]) => {
      const queries = queryClient.getQueriesData<any[]>({ queryKey: ["ingredients"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<any[]>(key, updater(data));
      });
    };

    const upsertStaffInCaches = (updater: (staffList: any[]) => any[]) => {
      const queries = queryClient.getQueriesData<any[]>({ queryKey: ["staff"] });
      queries.forEach(([key, data]) => {
        if (!data) return;
        queryClient.setQueryData<any[]>(key, updater(data));
      });
    };

    const handleEvent = (evt: MessageEvent) => {
      try {
        const event: AppEvent<any> = JSON.parse(evt.data);
        
        switch (event.type) {
          // Order events
          case "order.created":
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            break;
          case "order.updated":
            if (event.payload?.order) {
              const updated = event.payload.order as Order;
              upsertOrderInCaches((list) => list.map((o) => (o.id === updated.id ? updated : o)));
            } else if (event.payload?.id) {
              queryClient.invalidateQueries({ queryKey: ["orders"] });
            }
            break;
          case "order.status.changed":
            upsertOrderInCaches((list) =>
              list.map((o) =>
                o.id === event.payload.id
                  ? { ...o, status: event.payload.status, subStatus: event.payload.subStatus }
                  : o
              )
            );
            break;
          case "order.deleted":
            upsertOrderInCaches((list) => list.filter((o) => o.id !== event.payload.id));
            break;
          
          // Table events
          case "table.updated":
            if (event.payload?.deleted) {
              upsertTableInCaches((list) => list.filter((t) => t.id !== event.payload.id));
            } else if (event.payload?.table) {
              const updated = event.payload.table as Table;
              upsertTableInCaches((list) => list.map((t) => (t.id === updated.id ? updated : t)));
            }
            break;
          case "table.status.changed":
            if (event.payload?.table) {
              const updated = event.payload.table as Table;
              upsertTableInCaches((list) => list.map((t) => (t.id === updated.id ? updated : t)));
            }
            break;
          case "table.occupied":
          case "table.available":
          case "table.reserved":
          case "table.cleaning":
          case "table.unavailable":
            if (event.payload?.table) {
              const updated = event.payload.table as Table;
              upsertTableInCaches((list) => list.map((t) => (t.id === updated.id ? updated : t)));
            }
            break;

          // Product events
          case "product.updated":
            if (event.payload?.deleted) {
              upsertProductInCaches((list) => list.filter((p) => p.id !== event.payload.id));
            } else if (event.payload?.product) {
              const updated = event.payload.product;
              upsertProductInCaches((list) => list.map((p) => (p.id === updated.id ? updated : p)));
            }
            break;

          // Inventory events
          case "inventory.updated":
            // Invalidate inventory-related queries
            queryClient.invalidateQueries({ queryKey: ["stock-items"] });
            queryClient.invalidateQueries({ queryKey: ["ingredients"] });
            break;

          // Staff events
          case "staff.updated":
            if (event.payload?.deleted) {
              upsertStaffInCaches((list) => list.filter((s) => s.id !== event.payload.id));
            } else if (event.payload?.staff) {
              const updated = event.payload.staff;
              upsertStaffInCaches((list) => list.map((s) => (s.id === updated.id ? updated : s)));
            }
            break;
        }
      } catch (error) {
        console.error("Error handling real-time event:", error);
      }
    };

    // Listen to all event types
    const eventTypes = [
      "order.created", "order.updated", "order.status.changed", "order.deleted",
      "table.updated", "table.status.changed", "table.occupied", "table.available", 
      "table.reserved", "table.cleaning", "table.unavailable",
      "product.updated", "inventory.updated", "staff.updated"
    ];

    eventTypes.forEach(eventType => {
      es.addEventListener(eventType, handleEvent);
    });

    // Handle visibility change to refresh data when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Refresh all critical data when tab becomes visible
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["tables"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        queryClient.invalidateQueries({ queryKey: ["stock-items"] });
        queryClient.invalidateQueries({ queryKey: ["ingredients"] });
        queryClient.invalidateQueries({ queryKey: ["staff"] });
      }
    };
    
    document.addEventListener("visibilitychange", onVisibility);

    // Handle connection errors and reconnection
    es.onerror = () => {
      console.warn("SSE connection lost, attempting to reconnect...");
      setTimeout(() => {
        if (esRef.current) {
          esRef.current.close();
          esRef.current = null;
        }
      }, 5000);
    };

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
  }, [queryClient]);
}
