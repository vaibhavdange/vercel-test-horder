"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type CurrencyCode = string; // e.g., 'INR', 'USD', 'EUR'

interface CurrencyContextValue {
  code: CurrencyCode;
  symbol: string;
  format: (amount: number) => string;
}

const DEFAULT_CODE: CurrencyCode = 'INR';

const getCurrencySymbol = (currencyCode: string): string => {
  try {
    const formatter = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    const parts = formatter.formatToParts(0);
    const symbol = parts.find((p) => p.type === 'currency')?.value;
    return symbol || currencyCode;
  } catch {
    return currencyCode;
  }
};

const CurrencyContext = createContext<CurrencyContextValue>({
  code: DEFAULT_CODE,
  symbol: getCurrencySymbol(DEFAULT_CODE),
  format: (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: DEFAULT_CODE }).format(amount),
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [code, setCode] = useState<CurrencyCode>(() => {
    if (typeof window === 'undefined') return DEFAULT_CODE;
    try {
      const raw = window.localStorage.getItem('settings.general');
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed?.currency || DEFAULT_CODE;
    } catch {
      return DEFAULT_CODE;
    }
  });

  useEffect(() => {
    const apply = () => {
      try {
        const raw = window.localStorage.getItem('settings.general');
        const parsed = raw ? JSON.parse(raw) : {};
        const newCode = parsed?.currency || DEFAULT_CODE;
        setCode(newCode);
      } catch (error) {
        console.error('Currency hook: Error parsing localStorage:', error);
      }
    };
    
    // Apply immediately on mount
    apply();
    
    // Set up event listeners
    const handler = () => apply();
    window.addEventListener('settings:currencyChanged', handler);
    window.addEventListener('storage', handler);
    
    return () => {
      window.removeEventListener('settings:currencyChanged', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const value = useMemo<CurrencyContextValue>(() => ({
    code,
    symbol: getCurrencySymbol(code),
    format: (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(amount),
  }), [code]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}


