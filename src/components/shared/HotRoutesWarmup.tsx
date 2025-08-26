"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { TablesService } from "@/lib/services/tablesService";

export default function HotRoutesWarmup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    let cancelled = false;

    const isSlowOrSavingData = () => {
      try {
        const nav = (navigator as any);
        const conn = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
        if (!conn) return false;
        // Save-Data or really slow connection
        if (conn.saveData) return true;
        const effectiveType = conn.effectiveType as string | undefined;
        return effectiveType === '2g' || effectiveType === 'slow-2g';
      } catch {
        return false;
      }
    };

    const schedule = (fn: () => void, delay = 0): (() => void) | undefined => {
      if (typeof window === 'undefined') return undefined;
      if ('requestIdleCallback' in window) {
        // @ts-ignore
        const id = window.requestIdleCallback(() => !cancelled && fn(), { timeout: 1500 });
        return () => {
          try { /* @ts-ignore */ window.cancelIdleCallback && window.cancelIdleCallback(id); } catch {}
        };
      }
      const id = (window as any).setTimeout(() => !cancelled && fn(), delay);
      return () => (window as any).clearTimeout(id);
    };

    // Skip heavy warmup on constrained devices
    if (isSlowOrSavingData()) {
      // Still prefetch routes (tiny) to improve UX
      schedule(() => {
        ['/dashboard/new-order', '/dashboard/orders', '/dashboard/tables']
          .forEach((path) => router.prefetch(path));
      }, 300);
      return () => { cancelled = true; };
    }

    // Prefetch route code only (no API calls) to avoid triggering server functions
    const cancelA = schedule(() => {
      ['/dashboard/new-order', '/dashboard/orders', '/dashboard/tables']
        .forEach((path) => router.prefetch(path));
    }, 200);

    // In production, skip warming API datasets that may rely on server-only DB
    const cancelB = process.env.NODE_ENV === 'production'
      ? undefined
      : schedule(async () => {
          try {
            await Promise.allSettled([
              queryClient.prefetchQuery({
                queryKey: ['categories'],
                queryFn: async () => (await fetch('/api/categories')).json(),
                staleTime: 30_000,
              }),
              queryClient.prefetchQuery({
                queryKey: ['products'],
                queryFn: async () => (await fetch('/api/products')).json(),
                staleTime: 30_000,
              }),
              queryClient.prefetchQuery({
                queryKey: ['tables'],
                queryFn: TablesService.getTables,
                staleTime: 15_000,
              }),
              queryClient.prefetchQuery({
                queryKey: ['floors'],
                queryFn: TablesService.getFloors,
                staleTime: 30_000,
              }),
              queryClient.prefetchQuery({
                queryKey: ['areas'],
                queryFn: TablesService.getAreas,
                staleTime: 30_000,
              }),
              queryClient.prefetchQuery({
                queryKey: ['orders', undefined],
                queryFn: async () => (await fetch('/api/orders')).json(),
                staleTime: 10_000,
              }),
            ]);
          } catch {}
        }, 600);

    return () => {
      cancelled = true;
      cancelA && (cancelA as any)();
      cancelB && (cancelB as any)();
    };
  }, [queryClient, router]);

  return null;
}


