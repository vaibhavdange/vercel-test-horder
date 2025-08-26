"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';
import { useEffect } from 'react';
import { CurrencyProvider } from '@/hooks/useCurrency';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Increase stale time to avoid immediate refetches on navigation
        staleTime: 10 * 1000,
        gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
        retry: 3,
        // Reduce noisy refetches that cause UI jank
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        // Keep background refetch when intervals are set in hooks
        refetchIntervalInBackground: true,
      },
    },
  }));

  // Apply theme (dark mode and accent color) from localStorage
  useEffect(() => {
    const applyTheme = () => {
      try {
        const raw = localStorage.getItem('settings.general');
        const parsed = raw ? JSON.parse(raw) : {};
        const theme = parsed?.theme || {};
        const dark = Boolean(theme.darkMode);
        const accent = theme.accent || '#16a34a';
        const root = document.documentElement;
        root.classList.toggle('dark', dark);
        root.style.setProperty('--accent-color', accent);
      } catch {}
    };

    applyTheme();
    const handler = () => applyTheme();
    window.addEventListener('settings:themeChanged', handler);
    return () => window.removeEventListener('settings:themeChanged', handler);
  }, []);

  // Hydrate printers bill settings on app load for consistency across windows
  useEffect(() => {
    const hydratePrinters = async () => {
      try {
        const res = await fetch('/api/settings/printers');
        if (res.ok) {
          const data = await res.json();
          if (data?.bill && typeof data.bill === 'object') {
            try { localStorage.setItem('settings.print.bill', JSON.stringify(data.bill)); } catch {}
          }
          if (Array.isArray(data?.profiles)) {
            try { localStorage.setItem('settings.printers', JSON.stringify(data.profiles)); } catch {}
          }
        }
      } catch {}
    };
    hydratePrinters();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CurrencyProvider>
        {children}
        <ReactQueryDevtools initialIsOpen={false} />
      </CurrencyProvider>
    </QueryClientProvider>
  );
}
