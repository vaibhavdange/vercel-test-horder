// Lightweight in-memory EventBus for server-sent events
// Note: Lives in-memory per server instance. Good for a single-process Electron/Next app.

type EventListener = (event: AppEvent) => void;

export type AppEventType =
  | "order.created"
  | "order.updated"
  | "order.deleted"
  | "order.status.changed"
  | "table.updated"
  | "table.status.changed"
  | "table.occupied"
  | "table.available"
  | "table.reserved"
  | "table.cleaning"
  | "table.unavailable"
  | "product.updated"
  | "inventory.updated"
  | "staff.updated";

export interface AppEvent<TPayload = any> {
  type: AppEventType;
  payload: TPayload;
  timestamp: number;
}

class EventBus {
  private listeners: Set<EventListener> = new Set();

  subscribe(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit<T = any>(type: AppEventType, payload: T): void {
    const event: AppEvent<T> = { type, payload, timestamp: Date.now() };
    this.listeners.forEach((l) => {
      try {
        l(event);
      } catch {
        // ignore listener errors
      }
    });
  }
}

export const eventBus = new EventBus();


