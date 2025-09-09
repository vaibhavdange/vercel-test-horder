"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { multiTenantDb } from '@/lib/database/supabase-multi-tenant';

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  settings: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TenantContextType {
  tenant: Tenant | null;
  loading: boolean;
  error: string | null;
  isSubdomain: boolean;
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  loading: true,
  error: null,
  isSubdomain: false,
});

export function TenantProvider({ 
  children, 
  tenant: initialTenant 
}: { 
  children: React.ReactNode;
  tenant?: Tenant;
}) {
  const [tenant, setTenant] = useState<Tenant | null>(initialTenant || null);
  const [loading, setLoading] = useState(!initialTenant);
  const [error, setError] = useState<string | null>(null);
  const [isSubdomain, setIsSubdomain] = useState(false);

  useEffect(() => {
    // Check if we're on a subdomain
    const hostname = window.location.hostname;
    const isSubdomainRequest = hostname.includes('.') && 
                              !hostname.includes('localhost') && 
                              !hostname.includes('127.0.0.1') &&
                              !hostname.includes(process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'horder.com');
    
    setIsSubdomain(isSubdomainRequest);

    if (initialTenant) {
      // Set tenant context in database service
      multiTenantDb.setTenant(initialTenant.id);
      setLoading(false);
    } else if (isSubdomainRequest) {
      // For subdomain requests, we should have tenant info from middleware
      // This will be handled by the server-side rendering
      setLoading(false);
    } else {
      // For main domain, try to get user's tenant
      loadUserTenant();
    }
  }, [initialTenant]);

  const loadUserTenant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // This would typically be called from a client-side hook
      // For now, we'll just set loading to false
      setLoading(false);
    } catch (err) {
      console.error('Error loading tenant:', err);
      setError(err instanceof Error ? err.message : 'Failed to load tenant');
      setLoading(false);
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, loading, error, isSubdomain }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

// Hook to get tenant from server-side headers
export function useServerTenant() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This would be called from a server component or API route
    // to get tenant info from headers
    const loadServerTenant = async () => {
      try {
        const response = await fetch('/api/tenant/current');
        if (response.ok) {
          const data = await response.json();
          setTenant(data.tenant);
          if (data.tenant) {
            multiTenantDb.setTenant(data.tenant.id);
          }
        }
      } catch (error) {
        console.error('Error loading server tenant:', error);
      } finally {
        setLoading(false);
      }
    };

    loadServerTenant();
  }, []);

  return { tenant, loading };
}
