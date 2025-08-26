"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AppEvent } from "@/lib/services/event-bus";
import type { Order } from "@/types/orders";
import type { Table } from "@/types/tables";

// Subscribe to SSE and update the React Query cache on order and table events
export function useOrdersEvents() {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/events");
    esRef.current = es;

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

    const handleEvent = (evt: MessageEvent) => {
      try {
        const event: AppEvent<any> = JSON.parse(evt.data);
        switch (event.type) {
          case "order.created":
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            break;
          case "order.updated":
            if (event.payload?.order) {
              const updated = event.payload.order as Order;
              upsertOrderInCaches((list) => list.map((o) => (o.id === updated.id ? updated : o)));
            } else if (event.payload?.id) {
              // Fallback to refetch if only ID was sent
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
              // Table was deleted
              upsertTableInCaches((list) => list.filter((t) => t.id !== event.payload.id));
            } else if (event.payload?.table) {
              // Table was updated
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
        }
      } catch {
        // ignore bad payloads
      }
    };

    es.addEventListener("order.created", handleEvent);
    es.addEventListener("order.updated", handleEvent);
    es.addEventListener("order.status.changed", handleEvent);
    es.addEventListener("order.deleted", handleEvent);
    
    // Table events
    es.addEventListener("table.updated", handleEvent);
    es.addEventListener("table.status.changed", handleEvent);
    es.addEventListener("table.occupied", handleEvent);
    es.addEventListener("table.available", handleEvent);
    es.addEventListener("table.reserved", handleEvent);
    es.addEventListener("table.cleaning", handleEvent);
    es.addEventListener("table.unavailable", handleEvent);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["tables"] });
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      es.close();
      esRef.current = null;
    };
  }, [queryClient]);
}


